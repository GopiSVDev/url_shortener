import { IconArrowLeft } from "@tabler/icons-react";
import { Link, useLocation } from "react-router";
import { ErrorState } from "~/components/ErrorState";
import { Seo } from "~/components/Seo";
import { useI18n } from "~/lib/i18n/i18n";

export function NotFoundPage() {
  const { t, localize } = useI18n();
  const { pathname } = useLocation();

  return (
    <>
      <Seo title={t("errors.notFoundTitle")} noIndex />
      <ErrorState
        status={404}
        title={t("errors.notFoundTitle")}
        description={t("errors.notFoundText")}
        detail={
          <code
            style={{
              display: "inline-block",
              maxWidth: "100%",
              padding: "4px 10px",
              borderRadius: 6,
              background: "var(--surface-2)",
              overflowWrap: "anywhere",
            }}
          >
            {pathname}
          </code>
        }
        actions={
          <>
            <Link to={localize("/")} className="btn btn-primary">
              <IconArrowLeft size={17} />
              {t("errors.backHome")}
            </Link>
            <Link to={localize("/features")} className="btn">
              {t("nav.features")}
            </Link>
          </>
        }
      />
    </>
  );
}
