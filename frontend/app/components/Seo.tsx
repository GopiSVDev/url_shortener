import { useLocation } from "react-router";
import { site } from "~/config/site";
import { useI18n } from "~/lib/i18n/i18n";
import { defaultLocale, locales, localizePath, stripLocale } from "~/lib/i18n/locales";
import { useRootData } from "~/lib/root-data";

type SeoProps = {
  title: string;
  description?: string;
  /** Keep the page out of search results (e.g. account pages). */
  noIndex?: boolean;
  /** Use the title as-is instead of appending the site name. */
  exactTitle?: boolean;
};

/** Per-page document metadata. React hoists these tags into <head>. */
export function Seo({ title, description, noIndex, exactTitle }: SeoProps) {
  const { locale } = useI18n();
  const { siteUrl } = useRootData();
  const path = stripLocale(useLocation().pathname);
  const fullTitle = exactTitle ? title : `${title} · ${site.name}`;
  const url = (lang: string) => siteUrl + localizePath(path, lang);

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noIndex ? (
        <meta name="robots" content="noindex" />
      ) : (
        <>
          <link rel="canonical" href={url(locale)} />
          {locales.length > 1 &&
            [...locales, "x-default"].map((lang) => (
              <link
                key={lang}
                rel="alternate"
                hrefLang={lang}
                href={url(lang === "x-default" ? defaultLocale : lang)}
              />
            ))}
        </>
      )}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url(locale)} />
      <meta property="og:locale" content={locale.replace("-", "_")} />
      <meta name="twitter:card" content="summary" />
    </>
  );
}
