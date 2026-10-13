import { z } from "zod";
import { ApiError } from "~/.server/api";
import type { FormErrors } from "~/.server/form";
import type { MessageKey } from "~/lib/i18n/locales";
import { normalizeUrl } from "~/features/links/format";

export type LinkField = "url" | "alias" | "expiresAt";
export type LinkFormErrors = FormErrors<LinkField>;

// Must match the backend's ShortUrlRequest rules.
const aliasPattern = /^[A-Za-z0-9][A-Za-z0-9-]{1,28}[A-Za-z0-9]$/;

export const linkFormSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "errors.urlRequired")
    .transform((value, ctx) => {
      const url = normalizeUrl(value);
      if (!url) ctx.addIssue({ code: "custom", message: "errors.urlInvalid" });
      return url ?? "";
    }),
  alias: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || aliasPattern.test(value),
      "errors.aliasInvalid",
    ),
  // datetime-local value, interpreted as UTC
  expiresAt: z
    .string()
    .optional()
    .refine(
      (value) => !value || new Date(`${value}Z`).getTime() > Date.now(),
      "errors.expiryPast",
    ),
});

/** Maps a failed backend call to form errors. */
export function linkApiErrors(error: unknown): LinkFormErrors {
  if (!(error instanceof ApiError)) {
    console.error("Link request failed", error);
    return { form: "errors.unavailable" };
  }
  if (error.status === 409) return { alias: "errors.aliasTaken" };
  if (error.status === 429) return { form: "errors.tooManyRequests" };
  if (error.status === 403 || error.status === 404) {
    return { form: "errors.linkNotFound" };
  }
  if (error.status === 400) {
    const body = error.body as { message?: unknown; detail?: unknown } | null;
    const fields = typeof body?.message === "object" ? body.message : null;
    if (fields && "alias" in fields) return { alias: "errors.aliasInvalid" };
    if (fields && "expirationDate" in fields)
      return { expiresAt: "errors.expiryPast" };
    if (fields && "originalUrl" in fields) return { url: "errors.urlInvalid" };
    return { form: "errors.invalidInput" };
  }
  if (error.status >= 500) console.error("Link request failed", error);
  return { form: "errors.unavailable" satisfies MessageKey };
}
