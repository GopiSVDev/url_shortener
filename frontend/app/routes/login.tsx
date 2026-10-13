import type { Route } from "./+types/login";
import { Seo } from "~/components/Seo";
import { AuthForm } from "~/features/auth/AuthForm";
import { submitAuth } from "~/.server/auth/auth-form";
import { requireGuest } from "~/.server/auth/session";
import { useI18n } from "~/lib/i18n/i18n";
import type { RouteHandle } from "~/components/layout/AppLayout";

export const middleware: Route.MiddlewareFunction[] = [requireGuest];

export const action = (args: Route.ActionArgs) => submitAuth(args, "login");

export const handle: RouteHandle = { title: "nav.login" };

export default function Login({ actionData }: Route.ComponentProps) {
  const { t } = useI18n();
  return (
    <>
      <Seo
        title={t("meta.loginTitle")}
        description={t("meta.loginDescription")}
      />
      <AuthForm flow="login" actionData={actionData} />
    </>
  );
}
