import type { ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { authContext, authMiddleware } from "~/.server/auth/session";
import { getSiteUrl } from "~/.server/env";
import { themeScript } from "~/lib/theme";
import { I18nProvider } from "~/lib/i18n/i18n";
import { defaultLocale, loadMessages, resolveLocale } from "~/lib/i18n/locales";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const locale = resolveLocale(params.lang) ?? defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
    user: context.get(authContext).user,
    siteUrl: getSiteUrl(request),
  };
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang={data?.locale ?? defaultLocale} dir="ltr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f6f2ea" />
        {/* Sets data-theme before first paint, so dark mode never flashes light */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <I18nProvider locale={loaderData.locale} messages={loaderData.messages}>
      <Outlet />
    </I18nProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const status = isRouteErrorResponse(error) ? error.status : 500;
  const stack =
    import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main className="page" style={{ paddingBlock: 96 }}>
      <p className="eyebrow">{status}</p>
      <h1 style={{ marginTop: 8 }}>
        {status === 404 ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="muted" style={{ marginTop: 8 }}>
        {status === 404
          ? "The page you're looking for doesn't exist."
          : "Please try again later."}
      </p>
      {stack && (
        <pre style={{ overflowX: "auto", fontSize: 12, marginTop: 32 }}>
          {stack}
        </pre>
      )}
    </main>
  );
}
