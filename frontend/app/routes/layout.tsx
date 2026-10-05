import { Button } from "@mantine/core";
import {
  data,
  isRouteErrorResponse,
  Link,
  Outlet,
  redirect,
} from "react-router";
import type { Route } from "./+types/layout";
import { ErrorState } from "~/components/ErrorState";
import { NotFoundPage } from "~/components/NotFoundPage";
import { Seo } from "~/components/Seo";
import { AppLayout } from "~/components/layout/AppLayout";
import { useI18n } from "~/lib/i18n/i18n";
import { defaultLocale, resolveLocale, stripLocale } from "~/lib/i18n/locales";

export function loader({ params, request }: Route.LoaderArgs) {
  if (params.lang === defaultLocale) {
    const url = new URL(request.url);
    throw redirect(stripLocale(url.pathname) + url.search, 301);
  }
  if (!resolveLocale(params.lang)) {
    throw data(null, { status: 404 });
  }
  return null;
}

export default function SiteLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

// Unexpected errors, plus 404s for unknown first segments: /xyz matches as
// locale "xyz", which the loader above rejects before the catch-all route runs.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t, localize } = useI18n();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <AppLayout title={t("errors.notFoundTitle")}>
        <NotFoundPage />
      </AppLayout>
    );
  }

  const title = t("errors.unexpectedTitle");
  return (
    <AppLayout title={title}>
      <Seo title={title} noIndex />
      <ErrorState
        status={500}
        title={title}
        description={t("errors.unexpectedText")}
        actions={
          <Button component={Link} to={localize("/")}>
            {t("errors.backHome")}
          </Button>
        }
      />
    </AppLayout>
  );
}
