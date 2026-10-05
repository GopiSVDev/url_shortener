import { Button, Code } from "@mantine/core";
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
          <Code fz="sm" maw="100%" style={{ overflowWrap: "anywhere" }}>
            {pathname}
          </Code>
        }
        actions={
          <>
            <Button
              component={Link}
              to={localize("/")}
              leftSection={<IconArrowLeft size={16} />}
            >
              {t("errors.backHome")}
            </Button>
            <Button
              component={Link}
              to={localize("/features")}
              variant="default"
            >
              {t("nav.features")}
            </Button>
          </>
        }
      />
    </>
  );
}
