import { data, redirect, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { ApiError } from "~/.server/api";
import { parseForm, type FormErrors } from "~/.server/form";
import { localizePath, type MessageKey } from "~/lib/i18n/locales";
import { login, register } from "./auth-api.server";
import { authContext } from "./session.server";

type Flow = "login" | "register";

const byteLength = (value: string) => new TextEncoder().encode(value).length;

const schemas = {
  login: z.object({
    username: z.string().trim().min(1, "errors.usernameRequired"),
    password: z.string().min(1, "errors.passwordRequired"),
  }),
  register: z
    .object({
      username: z
        .string()
        .trim()
        .min(1, "errors.usernameRequired")
        .min(3, "errors.usernameLength")
        .max(50, "errors.usernameLength")
        .regex(/^[A-Za-z0-9_.-]+$/, "errors.usernameChars"),
      password: z
        .string()
        .min(1, "errors.passwordRequired")
        .min(8, "errors.passwordLength")
        .max(100, "errors.passwordTooLong")
        .refine((value) => byteLength(value) <= 72, "errors.passwordTooLong"),
      confirmPassword: z.string().min(1, "errors.confirmRequired"),
    })
    .refine((form) => form.password === form.confirmPassword, {
      message: "errors.passwordMismatch",
      path: ["confirmPassword"],
    }),
};

export type AuthActionData = {
  errors: FormErrors<"username" | "password" | "confirmPassword">;
  username: string;
};

export async function submitAuth(
  { request, context, params }: ActionFunctionArgs,
  flow: Flow,
) {
  const form = await parseForm(request, schemas[flow]);

  if (!form.data) {
    return data<AuthActionData>(
      { errors: form.errors, username: String(form.values.username ?? "") },
      400,
    );
  }

  try {
    const { username, password } = form.data;
    const tokens = await (flow === "login" ? login : register)({
      username,
      password,
    });

    context.get(authContext).signIn(tokens);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 503;
    if (status >= 500) console.error(`${flow} failed`, error);
    return data<AuthActionData>(
      {
        errors: { form: errorKey(status, flow) },
        username: form.data.username,
      },
      status,
    );
  }

  throw redirect(localizePath("/welcome", params.lang));
}

function errorKey(status: number, flow: Flow): MessageKey {
  if (status === 401) return "errors.invalidCredentials";
  if (status === 409) return "errors.usernameTaken";
  // Login rejects over-long input with 400; never reveal more than "incorrect".
  if (status === 400)
    return flow === "login"
      ? "errors.invalidCredentials"
      : "errors.invalidInput";
  return "errors.unavailable";
}
