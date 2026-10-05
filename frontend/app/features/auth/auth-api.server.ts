import { z } from "zod";
import { api, ApiError } from "~/lib/api.server";

const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type Tokens = z.infer<typeof tokensSchema>;
export type Credentials = { username: string; password: string };

export function login(credentials: Credentials) {
  return api("/api/auth/login", tokensSchema, {
    method: "POST",
    body: credentials,
  });
}

export function register(credentials: Credentials) {
  return api("/api/auth/register", tokensSchema, {
    method: "POST",
    body: credentials,
  });
}

/** Returns new tokens, or null if the refresh token was rejected. Throws if the backend is unreachable. */
export async function refresh(refreshToken: string): Promise<Tokens | null> {
  try {
    return await api("/api/auth/refresh", tokensSchema, {
      method: "POST",
      body: { refreshToken },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) return null;
    throw error;
  }
}
