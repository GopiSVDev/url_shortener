const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback: string) {
  const value = process.env[name];
  if (value) return value;
  if (isProd) throw new Error(`Missing required env var ${name}`);
  return devFallback;
}

export const env = {
  isProd,
  apiUrl: process.env.API_URL ?? "http://localhost:4000",
  sessionSecret: required("SESSION_SECRET", "dev-only-session-secret"),
  siteUrl: process.env.SITE_URL?.replace(/\/+$/, "") || undefined,
};

/** Absolute origin used for canonical URLs, sitemap, etc. Falls back to the request origin until SITE_URL is set. */
export function getSiteUrl(request: Request) {
  return env.siteUrl ?? new URL(request.url).origin;
}
