import { NativeSelect } from "@mantine/core";
import { useLocation, useNavigate } from "react-router";
import { useI18n } from "~/lib/i18n/i18n";
import { locales, localizePath, stripLocale } from "~/lib/i18n/locales";

/** Renders nothing until there is more than one locale file. */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  if (locales.length < 2) return null;

  return (
    <NativeSelect
      size="xs"
      aria-label={t("nav.language")}
      value={locale}
      data={locales.map((code) => ({ value: code, label: nativeName(code) }))}
      onChange={(event) => navigate(localizePath(stripLocale(pathname), event.currentTarget.value) + search)}
    />
  );
}

/** Each language in its own script, e.g. "Deutsch", "日本語". */
function nativeName(code: string) {
  const name = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
}
