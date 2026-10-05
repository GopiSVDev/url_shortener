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
import {
  ColorSchemeScript,
  Container,
  mantineHtmlProps,
  Text,
  Title,
} from "@mantine/core";
import type { Route } from "./+types/root";
import "./app.css";
import { AppTheme } from "~/app-theme";
import { authContext, authMiddleware } from "~/features/auth/session.server";
import { getSiteUrl } from "~/.server/env";
import { I18nProvider } from "~/lib/i18n/i18n";
import { defaultLocale, loadMessages, resolveLocale } from "~/lib/i18n/locales";
import { isSidebarCollapsed } from "~/lib/sidebar";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const locale = resolveLocale(params.lang) ?? defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
    user: context.get(authContext).user,
    siteUrl: getSiteUrl(request),
    sidebarCollapsed: isSidebarCollapsed(request.headers.get("Cookie")),
  };
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang={data?.locale ?? defaultLocale} dir="ltr" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript defaultColorScheme="auto" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppTheme>{children}</AppTheme>
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
    <Container component="main" size="sm" py={96}>
      <Title>
        {status === 404 ? "Page not found" : "Something went wrong"}
      </Title>
      <Text c="dimmed" mt="sm">
        {status === 404
          ? "The page you're looking for doesn't exist."
          : "Please try again later."}
      </Text>
      {stack && (
        <Text component="pre" size="xs" mt="xl" style={{ overflowX: "auto" }}>
          {stack}
        </Text>
      )}
    </Container>
  );
}
