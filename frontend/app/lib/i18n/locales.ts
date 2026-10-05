import type en from "~/locales/en.json";

/**
 * Every `app/locales/<code>.json` file is a supported locale; adding a file is all it takes.
 * The glob is lazy, so no translations end up in the client bundle.
 */
const files = import.meta.glob<Messages>("../../locales/*.json", {
  import: "default",
});

const fileFor = (locale: string) => `../../locales/${locale}.json`;

export const defaultLocale = "en";

export const locales = Object.keys(files)
  .map((path) => path.slice(path.lastIndexOf("/") + 1, -".json".length))
  .sort();

export type Messages = typeof en;

/** Dot-separated path to every string in en.json, e.g. "home.form.submit". */
export type MessageKey = Leaves<Messages>;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Maps the optional `:lang` URL segment to a locale; null if it's not a valid prefix. */
export function resolveLocale(lang: string | undefined) {
  if (lang === undefined) return defaultLocale;
  return lang !== defaultLocale && locales.includes(lang) ? lang : null;
}

/** "/login" -> "/login" for the default locale, "/de/login" for others. */
export function localizePath(path: string, locale = defaultLocale) {
  if (locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Inverse of localizePath: "/de/login" -> "/login". */
export function stripLocale(pathname: string) {
  const [, first, ...rest] = pathname.split("/");
  if (!locales.includes(first)) return pathname;
  return `/${rest.join("/")}`;
}

/** Loads a locale's messages, falling back to English for any missing keys. */
export async function loadMessages(locale: string): Promise<Messages> {
  const base = await files[fileFor(defaultLocale)]();
  if (locale === defaultLocale) return base;
  return deepMerge(base, await files[fileFor(locale)]());
}

function deepMerge<T>(base: T, override: unknown): T {
  if (typeof base !== "object" || base === null) {
    return typeof override === typeof base ? (override as T) : base;
  }
  const source = (override ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      deepMerge(value, source[key]),
    ]),
  ) as T;
}
