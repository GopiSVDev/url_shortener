import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { authContext } from "~/features/auth/session.server";
import { localizePath } from "~/lib/i18n/locales";

// Tokens are stateless, so logging out only clears the session cookie.
export function action({ context, params }: Route.ActionArgs) {
  context.get(authContext).signOut();
  return redirect(localizePath("/", params.lang));
}

export function loader({ params }: Route.LoaderArgs) {
  return redirect(localizePath("/", params.lang));
}
