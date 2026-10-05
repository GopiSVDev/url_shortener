import type { Route } from "./+types/robots";
import { getSiteUrl } from "~/.server/env";

export function loader({ request }: Route.LoaderArgs) {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${getSiteUrl(request)}/sitemap.xml`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
