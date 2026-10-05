import type { z } from "zod";
import type { MessageKey } from "~/lib/i18n/locales";

/** Field errors are translation keys; "form" holds errors not tied to a single field. */
export type FormErrors<Field extends string> = Partial<
  Record<Field | "form", MessageKey>
>;

/**
 * Validates submitted form data. Schema messages must be translation keys;
 * anything without one (e.g. a file where text was expected) maps to errors.invalidInput.
 */
export async function parseForm<T extends z.ZodObject>(
  request: Request,
  schema: T,
) {
  const values = Object.fromEntries(await request.formData());
  const result = schema.safeParse(values, {
    error: () => "errors.invalidInput",
  });
  if (result.success) return { data: result.data, errors: null, values };

  const errors: FormErrors<string> = {};
  for (const issue of result.error.issues) {
    errors[String(issue.path[0])] ??= issue.message as MessageKey;
  }
  return {
    data: null,
    errors: errors as FormErrors<keyof z.infer<T> & string>,
    values,
  };
}
