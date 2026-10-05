import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localizePath, type MessageKey, type Messages } from "./locales";

type Vars = Record<string, string | number>;

type I18n = {
  locale: string;
  /** Translates a key, replacing `{name}` placeholders with `vars`. */
  t: (key: MessageKey, vars?: Vars) => string;
  /** Prefixes an app path with the current locale. */
  localize: (path: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function createTranslator(messages: Messages) {
  return (key: MessageKey, vars?: Vars) => {
    const value = key
      .split(".")
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        messages,
      );
    if (typeof value !== "string") return key;
    return vars
      ? value.replace(/\{(\w+)\}/g, (match, name) =>
          String(vars[name] ?? match),
        )
      : value;
  };
}

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo<I18n>(
    () => ({
      locale,
      t: createTranslator(messages),
      localize: (path) => localizePath(path, locale),
    }),
    [locale, messages],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error("useI18n must be used within I18nProvider");
  return i18n;
}
