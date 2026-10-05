import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Center,
  Container,
  Group,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCircle,
  IconCircleCheckFilled,
} from "@tabler/icons-react";
import { Form, NavLink, useNavigation } from "react-router";
import { LogoMark } from "~/components/Logo";
import { useI18n } from "~/lib/i18n/i18n";
import type { AuthActionData } from "./auth-form.server";
import classes from "./AuthForm.module.css";

type Flow = "login" | "register";
type Field = keyof AuthActionData["errors"];

const MIN_PASSWORD_LENGTH = 8;

export function AuthForm({
  flow,
  actionData,
}: {
  flow: Flow;
  actionData: AuthActionData | undefined;
}) {
  const { t } = useI18n();
  const submitting = useNavigation().state === "submitting";
  const isLogin = flow === "login";

  const [edited, setEdited] = useState<ReadonlySet<Field>>(new Set());

  useEffect(() => setEdited(new Set()), [actionData]);

  const markEdited = (field: Field) =>
    setEdited((prev) => new Set(prev).add(field));

  const serverError = (field: Field) => {
    const key = actionData?.errors[field];
    return key && !edited.has(field) ? t(key) : undefined;
  };

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmBlurred, setConfirmBlurred] = useState(false);
  const mismatch = confirmBlurred && confirm !== "" && confirm !== password;

  return (
    <Container size={420} py={{ base: 40, sm: 80 }}>
      <Stack align="center" ta="center" gap={8}>
        <LogoMark size={44} />
        <Title
          order={1}
          fz={{ base: 24, sm: 28 }}
          mt="sm"
          style={{ letterSpacing: "-0.01em" }}
        >
          {t(`auth.${flow}.title`)}
        </Title>
        <Text c="dimmed" size="sm" maw={320}>
          {t(`auth.${flow}.subtitle`)}
        </Text>
      </Stack>

      <AuthTabs />

      <Form method="post" noValidate>
        <Stack gap="md" mt="lg">
          {serverError("form") && (
            <Alert
              color="red"
              variant="light"
              icon={<IconAlertCircle size={18} />}
              role="alert"
              py="xs"
            >
              {serverError("form")}
            </Alert>
          )}

          <TextInput
            name="username"
            size="md"
            label={t("auth.username")}
            placeholder={t("auth.usernamePlaceholder")}
            description={isLogin ? undefined : t("auth.usernameHint")}
            inputWrapperOrder={["label", "input", "description", "error"]}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={50}
            defaultValue={actionData?.username}
            error={serverError("username")}
            onChange={() => markEdited("username")}
          />

          <Box>
            <PasswordInput
              name="password"
              size="md"
              label={t("auth.password")}
              placeholder={t(
                isLogin
                  ? "auth.passwordPlaceholder"
                  : "auth.newPasswordPlaceholder",
              )}
              autoComplete={isLogin ? "current-password" : "new-password"}
              maxLength={100}
              error={serverError("password")}
              onChange={(event) => {
                setPassword(event.currentTarget.value);
                markEdited("password");
              }}
            />
            {!isLogin && (
              <PasswordRule met={password.length >= MIN_PASSWORD_LENGTH} />
            )}
          </Box>

          {!isLogin && (
            <PasswordInput
              name="confirmPassword"
              size="md"
              label={t("auth.confirmPassword")}
              placeholder={t("auth.confirmPlaceholder")}
              autoComplete="new-password"
              maxLength={100}
              error={
                serverError("confirmPassword") ??
                (mismatch ? t("errors.passwordMismatch") : undefined)
              }
              onChange={(event) => {
                setConfirm(event.currentTarget.value);
                markEdited("confirmPassword");
              }}
              onBlur={() => setConfirmBlurred(true)}
            />
          )}

          <Button
            type="submit"
            size="md"
            fullWidth
            mt="xs"
            loading={submitting}
          >
            {t(`auth.${flow}.submit`)}
          </Button>
        </Stack>
      </Form>
    </Container>
  );
}

function AuthTabs() {
  const { t, localize } = useI18n();
  const tabs = [
    { to: "/login", label: t("nav.login") },
    { to: "/register", label: t("nav.register") },
  ];

  return (
    <SimpleGrid
      component="nav"
      cols={2}
      spacing={4}
      p={4}
      mt="xl"
      bdrs="var(--mantine-radius-md)"
      className={classes.tabs}
      aria-label={t("auth.tabs")}
    >
      {tabs.map(({ to, label }) => (
        <Center
          key={to}
          component={NavLink}
          to={localize(to)}
          replace
          preventScrollReset
          h={34}
          fz="sm"
          fw={500}
          td="none"
          bdrs="var(--mantine-radius-sm)"
          className={classes.tab}
        >
          {label}
        </Center>
      ))}
    </SimpleGrid>
  );
}

function PasswordRule({ met }: { met: boolean }) {
  const { t } = useI18n();
  const Icon = met ? IconCircleCheckFilled : IconCircle;
  return (
    <Group gap={6} mt={8} c={met ? "teal" : "dimmed"} wrap="nowrap">
      <Icon size={14} aria-hidden />
      <Text size="xs" c={met ? "teal" : "dimmed"}>
        {t("auth.passwordRule")}
      </Text>
    </Group>
  );
}
