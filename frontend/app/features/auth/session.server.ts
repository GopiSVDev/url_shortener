import {
  createContext,
  createCookieSessionStorage,
  redirect,
  type MiddlewareFunction,
} from "react-router";
import { env } from "~/.server/env";
import { localizePath } from "~/lib/i18n/locales";
import { decodeJwt, isExpired } from "~/.server/jwt";
import { refresh, type Tokens } from "./auth-api.server";

export type User = { username: string };

export type Auth = {
  readonly user: User | null;
  readonly accessToken: string | null;
  signIn(tokens: Tokens): void;
  signOut(): void;
};

export const authContext = createContext<Auth>();

const storage = createCookieSessionStorage<Tokens>({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    secrets: [env.sessionSecret],
  },
});

export const authMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next,
) => {
  const session = await storage.getSession(request.headers.get("Cookie"));
  const accessToken = session.get("accessToken");
  const refreshToken = session.get("refreshToken");
  let tokens: Tokens | null =
    accessToken && refreshToken ? { accessToken, refreshToken } : null;
  let changed = false;

  if (tokens && isExpired(tokens.accessToken)) {
    try {
      tokens = await refresh(tokens.refreshToken);
      changed = true;
    } catch {
      tokens = null;
    }
  }

  context.set(authContext, {
    get user() {
      const username = tokens && decodeJwt(tokens.accessToken)?.sub;
      return username ? { username } : null;
    },
    get accessToken() {
      return tokens?.accessToken ?? null;
    },
    signIn(next) {
      tokens = next;
      changed = true;
    },
    signOut() {
      tokens = null;
      changed = true;
    },
  });

  const response = await next();
  if (changed)
    response.headers.append("Set-Cookie", await commit(session, tokens));
  return response;
};

function commit(
  session: Awaited<ReturnType<typeof storage.getSession>>,
  tokens: Tokens | null,
) {
  if (!tokens) return storage.destroySession(session);
  session.set("accessToken", tokens.accessToken);
  session.set("refreshToken", tokens.refreshToken);
  // The cookie lives exactly as long as the refresh token.
  const exp = decodeJwt(tokens.refreshToken)?.exp;
  const maxAge = exp
    ? Math.max(0, exp - Math.floor(Date.now() / 1000))
    : undefined;
  return storage.commitSession(session, { maxAge });
}

/** Route middleware: redirects to the login page when no user is signed in. */
export const requireUser: MiddlewareFunction<Response> = ({
  context,
  params,
}) => {
  if (!context.get(authContext).user) {
    throw redirect(localizePath("/login", params.lang));
  }
};

export const requireGuest: MiddlewareFunction<Response> = ({
  context,
  params,
}) => {
  if (context.get(authContext).user) {
    throw redirect(localizePath("/welcome", params.lang));
  }
};
