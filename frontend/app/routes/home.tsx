import { Anchor, Container, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { data, Link } from "react-router";
import type { Route } from "./+types/home";
import { parseForm } from "~/.server/form";
import type { RouteHandle } from "~/components/layout/AppLayout";
import { Seo } from "~/components/Seo";
import { site } from "~/config/site";
import { authContext } from "~/.server/auth/session";
import { createLink } from "~/.server/links/links-api";
import { linkApiErrors, linkFormSchema } from "~/.server/links/link-form";
import {
  ShortenForm,
  type ShortenActionData,
} from "~/features/links/ShortenForm";
import { useI18n } from "~/lib/i18n/i18n";
import { localizePath } from "~/lib/i18n/locales";
import { useRootData } from "~/lib/root-data";

export const handle: RouteHandle = { title: "nav.home" };

export async function action({ request, context }: Route.ActionArgs) {
  const form = await parseForm(request, linkFormSchema);
  if (!form.data) {
    return data<ShortenActionData>({ link: null, errors: form.errors }, 400);
  }

  try {
    const { url, alias, expiresAt } = form.data;
    const link = await createLink(
      {
        originalUrl: url,
        alias: alias || undefined,
        expirationDate: expiresAt || undefined,
      },
      context.get(authContext).accessToken,
      request,
    );
    return data<ShortenActionData>({ link, errors: null });
  } catch (error) {
    return data<ShortenActionData>(
      { link: null, errors: linkApiErrors(error) },
      400,
    );
  }
}

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

        <ShortenForm />

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
