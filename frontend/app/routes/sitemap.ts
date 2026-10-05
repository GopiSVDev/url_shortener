import type { Route } from "./+types/sitemap";
import { site } from "~/config/site";
import { getSiteUrl } from "~/.server/env";
import { locales, localizePath } from "~/lib/i18n/locales";

export function loader({ request }: Route.LoaderArgs) {
  const siteUrl = getSiteUrl(request);
  const url = (path: string, locale: string) =>
    siteUrl + localizePath(path, locale);

  const entries = site.indexedPaths.flatMap((path) =>
    locales.map((locale) => {
      const alternates =
        locales.length > 1
          ? locales
              .map(
                (alt) =>
                  `<xhtml:link rel="alternate" hreflang="${alt}" href="${url(path, alt)}"/>`,
              )
              .join("")
          : "";
      return `<url><loc>${url(path, locale)}</loc>${alternates}</url>`;
    }),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
