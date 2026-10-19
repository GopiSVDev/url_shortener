import { IconArrowRight } from "@tabler/icons-react";
import { data, Link } from "react-router";
import type { Route } from "./+types/home";
import { parseForm } from "~/.server/form";
import { Seo } from "~/components/Seo";
import { site } from "~/config/site";
import { authContext } from "~/.server/auth/session";
import { createLink } from "~/.server/links/links-api";
import { linkApiErrors, linkFormSchema } from "~/.server/links/link-form";
import {
  ShortenForm,
  type ShortenActionData,
} from "~/features/links/ShortenForm";
import type { LabelColor } from "~/lib/color";
import { useI18n } from "~/lib/i18n/i18n";
import { localizePath } from "~/lib/i18n/locales";
import { useRootData } from "~/lib/root-data";
import styles from "./home.module.css";

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

const steps: { key: "paste" | "share" | "measure"; color: LabelColor }[] = [
  { key: "paste", color: "tomato" },
  { key: "share", color: "jade" },
  { key: "measure", color: "cobalt" },
];

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

      <div className={`page ${styles.hero}`}>
        <h1 className={styles.title}>
          {t("home.titleStart")}{" "}
          <span className={styles.highlight}>{t("home.titleHighlight")}</span>
        </h1>
        <p className={styles.subtitle}>{t("home.subtitle")}</p>

        <div className={styles.formSlot}>
          <ShortenForm />
        </div>
      </div>

      <section className="page" aria-labelledby="steps-title">
        <h2 id="steps-title" className="visually-hidden">
          {t("home.steps.title")}
        </h2>
        <ol className={styles.steps}>
          {steps.map(({ key, color }, i) => (
            <li key={key} data-color={color} className={styles.step}>
              <span className={styles.stepNumber}>0{i + 1}</span>
              <h3>{t(`home.steps.${key}.title`)}</h3>
              <p>{t(`home.steps.${key}.text`)}</p>
            </li>
          ))}
        </ol>
        <Link to={localize("/features")} className={styles.more}>
          {t("home.allFeatures")}
          <IconArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
