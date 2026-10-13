/** Accepts "example.com/x" as well as full URLs; returns null for anything that isn't an http(s) web address. */
export function normalizeUrl(input: string) {
  const value = input.trim();
  if (!value) return null;

  try {
    const url = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`,
    );
    const isWeb = url.protocol === "http:" || url.protocol === "https:";
    return isWeb && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

const utc = (value: string) =>
  new Date(value.length === 10 ? `${value}T00:00:00Z` : `${value}Z`);

export function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(utc(value));
}

export function formatDateTime(value: string, locale: string) {
  return `${new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(utc(value))} UTC`;
}

export function toDateTimeInput(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

export function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, "");
}
