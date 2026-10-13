import { useEffect, useState } from "react";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Collapse,
  Flex,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconChartBar,
  IconChevronDown,
  IconDownload,
} from "@tabler/icons-react";
import { Link, useFetcher } from "react-router";
import { surface } from "~/app-theme";
import { useI18n } from "~/lib/i18n/i18n";
import { useRootData } from "~/lib/root-data";
import { CopyLinkButton } from "./CopyLinkButton";
import { displayUrl } from "./format";
import type { Link as ShortLink } from "~/.server/links/links-api";
import type { LinkFormErrors } from "~/.server/links/link-form";
import { createQrDataUrl, downloadQrPng } from "./qr";

export type ShortenActionData = {
  link: ShortLink | null;
  errors: LinkFormErrors | null;
};

/** Shortens a link through the home route's action. Signed-in users' links are saved to their account. */
export function ShortenForm() {
  const { t } = useI18n();
  const fetcher = useFetcher<ShortenActionData>();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  const errors = fetcher.data?.errors;
  const link = fetcher.data?.link ?? null;

  useEffect(() => setEdited(new Set()), [fetcher.data]);

  const error = (field: keyof LinkFormErrors) => {
    const key = errors?.[field];
    return key && !edited.has(field) ? t(key) : undefined;
  };
  const onEdit = (field: string) => () =>
    setEdited((prev) => new Set(prev).add(field));

  // Open the options when the server rejected one of them
  useEffect(() => {
    if (errors?.alias || errors?.expiresAt) setOptionsOpen(true);
  }, [errors]);

  return (
    <Paper
      component="section"
      withBorder
      radius="lg"
      p={{ base: "md", sm: "lg" }}
      shadow="xs"
    >
      <fetcher.Form method="post" noValidate>
        {error("form") && (
          <Alert
            color="red"
            variant="light"
            icon={<IconAlertCircle size={18} />}
            role="alert"
            mb="sm"
            py="xs"
          >
            {error("form")}
          </Alert>
        )}
        <Group align="flex-start" gap="sm" wrap="wrap">
          <TextInput
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            size="md"
            aria-label={t("home.form.label")}
            placeholder={t("home.form.placeholder")}
            error={error("url")}
            onChange={onEdit("url")}
            flex="1 1 280px"
          />
          <Button
            type="submit"
            size="md"
            w={{ base: "100%", xs: "auto" }}
            loading={fetcher.state !== "idle"}
          >
            {t("home.form.submit")}
          </Button>
        </Group>

        <UnstyledButton
          mt="sm"
          fz="sm"
          c="dimmed"
          onClick={() => setOptionsOpen((open) => !open)}
          aria-expanded={optionsOpen}
        >
          <Group gap={4}>
            {t("home.form.options")}
            <IconChevronDown
              size={14}
              style={{
                transform: optionsOpen ? "rotate(180deg)" : undefined,
                transition: "transform 150ms ease",
              }}
            />
          </Group>
        </UnstyledButton>

        {/* keepMounted so the option fields are submitted even when collapsed */}
        <Collapse expanded={optionsOpen} keepMountedMode="display-none">
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm" mt="sm">
            <TextInput
              name="alias"
              label={t("links.alias")}
              description={t("links.aliasHint")}
              placeholder="spring-26"
              maxLength={30}
              autoCapitalize="none"
              spellCheck={false}
              error={error("alias")}
              onChange={onEdit("alias")}
            />
            <TextInput
              name="expiresAt"
              type="datetime-local"
              label={t("links.expiresAt")}
              description={t("links.expiresHint")}
              error={error("expiresAt")}
              onChange={onEdit("expiresAt")}
            />
          </SimpleGrid>
        </Collapse>
      </fetcher.Form>

      {link && <ShortenResult link={link} />}
    </Paper>
  );
}

function ShortenResult({ link }: { link: ShortLink }) {
  const { t, localize } = useI18n();
  const { user } = useRootData();
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    createQrDataUrl(link.shortUrl).then((url) => current && setQr(url));
    return () => {
      current = false;
    };
  }, [link.shortUrl]);

  return (
    <Box aria-live="polite">
      {/* Details left, QR right; on phones the QR stacks on top. */}
      <Flex
        direction={{ base: "column-reverse", xs: "row" }}
        align={{ base: "stretch", xs: "center" }}
        gap="lg"
        mt="md"
        p="md"
        bg={surface.muted}
        bd="1px solid var(--mantine-color-default-border)"
        bdrs="var(--mantine-radius-md)"
      >
        <Stack gap={4} flex={1} miw={0}>
          <Text size="xs" c="dimmed" fw={500}>
            {t("home.form.result")}
          </Text>
          <Text fw={600} size="xl" truncate>
            {displayUrl(link.shortUrl)}
          </Text>
          <Text size="sm" c="dimmed" truncate title={link.originalUrl}>
            {link.originalUrl}
          </Text>
          <Group gap="xs" mt="sm">
            <CopyLinkButton value={link.shortUrl} variant="filled" />
            <Button
              size="xs"
              variant="default"
              leftSection={<IconDownload size={14} />}
              disabled={!qr}
              onClick={() => qr && downloadQrPng(qr, `qr-${link.shortCode}`)}
            >
              {t("home.form.downloadQr")}
            </Button>
            {user && (
              <Button
                size="xs"
                variant="default"
                component={Link}
                to={localize(`/links/${link.shortCode}`)}
                leftSection={<IconChartBar size={14} />}
              >
                {t("links.viewStats")}
              </Button>
            )}
          </Group>
        </Stack>

        {/* Always white behind the code so it scans in dark mode too. */}
        <Paper
          bg="white"
          p={6}
          radius="md"
          withBorder
          shadow="sm"
          mx={{ base: "auto", xs: 0 }}
          w={194}
          h={194}
          style={{ flexShrink: 0 }}
        >
          {qr && (
            <Image
              src={qr}
              alt={t("home.form.qrAlt", { url: link.shortUrl })}
              w={180}
              h={180}
            />
          )}
        </Paper>
      </Flex>
      <Text size="sm" c="dimmed" mt="sm" ta="center">
        {user ? (
          <>
            {t("home.form.saved")}{" "}
            <Anchor component={Link} to={localize("/links")} inherit>
              {t("home.form.savedCta")}
            </Anchor>
          </>
        ) : (
          <>
            {t("home.form.anonymous")}{" "}
            <Anchor component={Link} to={localize("/register")} inherit>
              {t("home.form.anonymousCta")}
            </Anchor>
          </>
        )}
      </Text>
    </Box>
  );
}
