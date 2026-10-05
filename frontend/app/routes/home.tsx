import { Anchor, Container, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { Link } from "react-router";
import type { RouteHandle } from "~/components/layout/AppLayout";
import { Seo } from "~/components/Seo";
import { site } from "~/config/site";
import { ShortenPreview } from "~/features/home/ShortenPreview";
import { useI18n } from "~/lib/i18n/i18n";
import { localizePath } from "~/lib/i18n/locales";
import { useRootData } from "~/lib/root-data";

export const handle: RouteHandle = { title: "nav.home" };

export default function Home() {
  const { t, locale, localize } = useI18n();
  const { siteUrl } = useRootData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": site.name,
    "url": siteUrl + localizePath("/", locale),
    "description": t("meta.homeDescription"),
    "inLanguage": locale,
  };

  return (
    <>
      <Seo
        title={`${site.name}: ${t("meta.homeTitle")}`}
        description={t("meta.homeDescription")}
        exactTitle
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container
        size="sm"
        py={{ base: 48, sm: 72 }}
        display="flex"
        mih="calc(100dvh - 160px)"
        style={{ flexDirection: "column", justifyContent: "center" }}
      >
        <Stack gap="lg" ta="center" mb={40}>
          <Title order={1} style={{ letterSpacing: "-0.02em" }}>
            {t("home.title")}
          </Title>
          <Text size="lg" c="dimmed" maw={520} mx="auto">
            {t("home.subtitle")}
          </Text>
        </Stack>

        <ShortenPreview />

        <Text ta="center" mt="xl" size="sm">
          <Anchor
            component={Link}
            to={localize("/features")}
            c="dimmed"
            inherit
          >
            {t("home.allFeatures")}
            <IconArrowRight
              size={14}
              style={{ verticalAlign: "-2px", marginInlineStart: 4 }}
            />
          </Anchor>
        </Text>
      </Container>
    </>
  );
}
