// Brand details live here. The public URL comes from the SITE_URL env var (see lib/env.server.ts).
export const site = {
  name: "Shortlink",
  // Pages listed in the sitemap, without a locale prefix.
  indexedPaths: ["/", "/features", "/login", "/register"],
} as const;
