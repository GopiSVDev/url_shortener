const isProd = process.env.NODE_ENV === "production";

function required(name: string, devFallback: string) {
  const value = process.env[name];
  if (value) return value;
  if (isProd) throw new Error(`Missing required env var ${name}`);
  return devFallback;
}

const siteUrl = process.env.SITE_URL?.replace(/\/+$/, "") || undefined;

export const env = {
  isProd,
  apiUrl: process.env.API_URL ?? "http://localhost:4000",
  sessionSecret: required("SESSION_SECRET", "dev-only-session-secret"),
  siteUrl,
  // Browsers drop Secure cookies on plain http (except localhost), so follow SITE_URL's scheme when it is set
  secureCookies: siteUrl ? siteUrl.startsWith("https://") : isProd,
};

/** Absolute origin used for canonical URLs, sitemap, etc. Falls back to the request origin until SITE_URL is set. */
export function getSiteUrl(request: Request) {
  return env.siteUrl ?? new URL(request.url).origin;
}
