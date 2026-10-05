import type { Route } from "./+types/register";
import { Seo } from "~/components/Seo";
import { AuthForm } from "~/features/auth/AuthForm";
import { submitAuth } from "~/features/auth/auth-form.server";
import { requireGuest } from "~/features/auth/session.server";
import { useI18n } from "~/lib/i18n/i18n";
import type { RouteHandle } from "~/components/layout/AppLayout";

export const middleware: Route.MiddlewareFunction[] = [requireGuest];

export const action = (args: Route.ActionArgs) => submitAuth(args, "register");

export const handle: RouteHandle = { title: "nav.register" };

export default function Register({ actionData }: Route.ComponentProps) {
  const { t } = useI18n();
  return (
    <>
      <Seo
        title={t("meta.registerTitle")}
        description={t("meta.registerDescription")}
      />
      <AuthForm flow="register" actionData={actionData} />
    </>
  );
}
