import {
  Button,
  Container,
  Group,
  Paper,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { Form, Link } from "react-router";
import type { Route } from "./+types/welcome";
import { Seo } from "~/components/Seo";
import { authContext, requireUser } from "~/features/auth/session.server";
import { useI18n } from "~/lib/i18n/i18n";
import type { RouteHandle } from "~/components/layout/AppLayout";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

export function loader({ context }: Route.LoaderArgs) {
  return { username: context.get(authContext).user!.username };
}

export const handle: RouteHandle = { title: "nav.account" };

export default function Welcome({ loaderData }: Route.ComponentProps) {
  const { t, localize } = useI18n();

  return (
    <Container size={480} py={{ base: 48, sm: 80 }}>
      <Seo title={t("meta.welcomeTitle")} noIndex />
      <Paper withBorder radius="lg" p={{ base: "lg", sm: "xl" }} ta="center">
        <ThemeIcon variant="light" color="green" size={48} radius="xl">
          <IconCheck size={26} />
        </ThemeIcon>
        <Title order={1} fz={{ base: 26, sm: 30 }} mt="md">
          {t("welcome.title")}
        </Title>
        <Text c="dimmed" mt="xs" style={{ overflowWrap: "anywhere" }}>
          {t("welcome.text", { username: loaderData.username })}
        </Text>
        <Group justify="center" mt="xl">
          <Button component={Link} to={localize("/")} variant="default">
            {t("welcome.home")}
          </Button>
          <Form method="post" action={localize("/logout")}>
            <Button type="submit">{t("nav.logout")}</Button>
          </Form>
        </Group>
      </Paper>
    </Container>
  );
}
