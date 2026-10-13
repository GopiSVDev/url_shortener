import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  Image,
  Menu,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconChartBar,
  IconDotsVertical,
  IconDownload,
  IconLink,
  IconPencil,
  IconPlus,
  IconQrcode,
  IconTrash,
} from "@tabler/icons-react";
import { data, Link, useFetcher } from "react-router";
import type { Route } from "./+types/links";
import { parseForm } from "~/.server/form";
import { surface } from "~/app-theme";
import type { RouteHandle } from "~/components/layout/AppLayout";
import { Seo } from "~/components/Seo";
import { authContext, requireUser } from "~/.server/auth/session";
import { CopyLinkButton } from "~/features/links/CopyLinkButton";
import {
  displayUrl,
  formatDate,
  formatDateTime,
  toDateTimeInput,
} from "~/features/links/format";
import {
  deleteLink,
  listLinks,
  updateLink,
  type Link as ShortLink,
} from "~/.server/links/links-api";
import {
  linkApiErrors,
  linkFormSchema,
  type LinkFormErrors,
} from "~/.server/links/link-form";
import { createQrDataUrl, downloadQrPng } from "~/features/links/qr";
import { useI18n } from "~/lib/i18n/i18n";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

export const handle: RouteHandle = { title: "nav.links" };

export async function loader({ context }: Route.LoaderArgs) {
  const token = context.get(authContext).accessToken!;
  return { links: await listLinks(token), now: Date.now() };
}

type ActionData = { ok: boolean; errors: LinkFormErrors | null };

export async function action({ request, context }: Route.ActionArgs) {
  const token = context.get(authContext).accessToken!;
  const fields = await request.clone().formData();
  const code = String(fields.get("code") ?? "");

  try {
    if (fields.get("intent") === "delete") {
      await deleteLink(code, token);
      return data<ActionData>({ ok: true, errors: null });
    }

    const form = await parseForm(request, linkFormSchema);
    if (!form.data) {
      return data<ActionData>({ ok: false, errors: form.errors }, 400);
    }
    await updateLink(
      code,
      {
        originalUrl: form.data.url,
        expirationDate: form.data.expiresAt || undefined,
      },
      token,
    );
    return data<ActionData>({ ok: true, errors: null });
  } catch (error) {
    return data<ActionData>({ ok: false, errors: linkApiErrors(error) }, 400);
  }
}

export default function Links({ loaderData }: Route.ComponentProps) {
  const { t, localize } = useI18n();
  const { links, now } = loaderData;
  const [editing, setEditing] = useState<ShortLink | null>(null);
  const [deleting, setDeleting] = useState<ShortLink | null>(null);
  const [qrFor, setQrFor] = useState<ShortLink | null>(null);

  return (
    <Container size="md" py={{ base: 32, sm: 48 }}>
      <Seo title={t("meta.linksTitle")} noIndex />

      <Group justify="space-between" mb="lg">
        <div>
          <Title order={1} fz={{ base: 26, sm: 30 }}>
            {t("links.title")}
          </Title>
          <Text c="dimmed" size="sm" mt={4}>
            {t("links.count", { count: links.length })}
          </Text>
        </div>
        <Button
          component={Link}
          to={localize("/")}
          leftSection={<IconPlus size={16} />}
        >
          {t("links.new")}
        </Button>
      </Group>

      {links.length === 0 ? (
        <Paper withBorder radius="lg" p="xl" ta="center" bg={surface.muted}>
          <IconLink size={32} stroke={1.5} />
          <Text fw={600} mt="sm">
            {t("links.emptyTitle")}
          </Text>
          <Text c="dimmed" size="sm" mt={4}>
            {t("links.emptyText")}
          </Text>
          <Button component={Link} to={localize("/")} mt="md">
            {t("links.new")}
          </Button>
        </Paper>
      ) : (
        <Stack gap="sm">
          {links.map((link) => (
            <LinkRow
              key={link.shortCode}
              link={link}
              now={now}
              onEdit={() => setEditing(link)}
              onDelete={() => setDeleting(link)}
              onQr={() => setQrFor(link)}
            />
          ))}
        </Stack>
      )}

      <EditModal link={editing} onClose={() => setEditing(null)} />
      <DeleteModal link={deleting} onClose={() => setDeleting(null)} />
      <QrModal link={qrFor} onClose={() => setQrFor(null)} />
    </Container>
  );
}

function LinkRow({
  link,
  now,
  onEdit,
  onDelete,
  onQr,
}: {
  link: ShortLink;
  now: number;
  onEdit: () => void;
  onDelete: () => void;
  onQr: () => void;
}) {
  const { t, locale, localize } = useI18n();
  const expired =
    link.expirationDate !== null &&
    new Date(`${link.expirationDate}Z`).getTime() <= now;

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Stack gap={2} miw={0} flex={1}>
          <Group gap="xs" wrap="nowrap">
            <Anchor
              href={link.shortUrl}
              target="_blank"
              rel="noreferrer"
              fw={600}
              truncate
            >
              {displayUrl(link.shortUrl)}
            </Anchor>
            {expired && (
              <Badge color="red" variant="light" size="sm">
                {t("links.expired")}
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed" truncate title={link.originalUrl}>
            {link.originalUrl}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {t("links.created", { date: formatDate(link.createdAt, locale) })}
            {link.expirationDate &&
              !expired &&
              ` · ${t("links.expires", { date: formatDateTime(link.expirationDate, locale) })}`}
          </Text>
        </Stack>

        <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
          <Group gap={4} wrap="nowrap">
            <Button
              component={Link}
              to={localize(`/links/${link.shortCode}`)}
              size="xs"
              variant="light"
              leftSection={<IconChartBar size={14} />}
            >
              {t("links.clicks", { count: link.clickCount ?? 0 })}
            </Button>
            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label={t("links.actions")}
                >
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconQrcode size={14} />}
                  onClick={onQr}
                >
                  {t("links.qr")}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPencil size={14} />}
                  onClick={onEdit}
                >
                  {t("links.edit")}
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={onDelete}
                >
                  {t("links.delete")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
          <CopyLinkButton value={link.shortUrl} />
        </Stack>
      </Group>
    </Paper>
  );
}

/** Closes the modal once its form was saved. */
function useSubmitAndClose(onClose: () => void) {
  const fetcher = useFetcher<ActionData>();
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) onClose();
  }, [fetcher.state, fetcher.data]);
  return fetcher;
}

function FormError({ errors }: { errors: LinkFormErrors | null | undefined }) {
  const { t } = useI18n();
  if (!errors?.form) return null;
  return (
    <Alert
      color="red"
      variant="light"
      icon={<IconAlertCircle size={18} />}
      role="alert"
      py="xs"
    >
      {t(errors.form)}
    </Alert>
  );
}

function EditModal({
  link,
  onClose,
}: {
  link: ShortLink | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal opened={link !== null} onClose={onClose} title={t("links.edit")}>
      {/* keyed, so every opened link gets a fresh form and no stale errors */}
      {link && <EditForm key={link.shortCode} link={link} onClose={onClose} />}
    </Modal>
  );
}

function EditForm({ link, onClose }: { link: ShortLink; onClose: () => void }) {
  const { t } = useI18n();
  const fetcher = useSubmitAndClose(onClose);
  const errors = fetcher.data?.ok === false ? fetcher.data.errors : null;

  return (
    <fetcher.Form method="post" noValidate>
      <input type="hidden" name="intent" value="update" />
      <input type="hidden" name="code" value={link.shortCode} />
      <Stack gap="md">
        <FormError errors={errors} />
        <Text size="sm" c="dimmed">
          {displayUrl(link.shortUrl)}
        </Text>
        <TextInput
          name="url"
          label={t("home.form.label")}
          defaultValue={link.originalUrl}
          error={errors?.url && t(errors.url)}
          data-autofocus
        />
        <TextInput
          name="expiresAt"
          type="datetime-local"
          label={t("links.expiresAt")}
          description={t("links.expiresEditHint")}
          defaultValue={toDateTimeInput(link.expirationDate)}
          error={errors?.expiresAt && t(errors.expiresAt)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t("links.cancel")}
          </Button>
          <Button type="submit" loading={fetcher.state !== "idle"}>
            {t("links.save")}
          </Button>
        </Group>
      </Stack>
    </fetcher.Form>
  );
}

function DeleteModal({
  link,
  onClose,
}: {
  link: ShortLink | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal
      opened={link !== null}
      onClose={onClose}
      title={t("links.deleteTitle")}
    >
      {link && (
        <DeleteForm key={link.shortCode} link={link} onClose={onClose} />
      )}
    </Modal>
  );
}

function DeleteForm({
  link,
  onClose,
}: {
  link: ShortLink;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const fetcher = useSubmitAndClose(onClose);
  const errors = fetcher.data?.ok === false ? fetcher.data.errors : null;

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="delete" />
      <input type="hidden" name="code" value={link.shortCode} />
      <Stack gap="md">
        <FormError errors={errors} />
        <Text size="sm">
          {t("links.deleteText", { link: displayUrl(link.shortUrl) })}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t("links.cancel")}
          </Button>
          <Button type="submit" color="red" loading={fetcher.state !== "idle"}>
            {t("links.delete")}
          </Button>
        </Group>
      </Stack>
    </fetcher.Form>
  );
}

function QrModal({
  link,
  onClose,
}: {
  link: ShortLink | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    setQr(null);
    if (!link) return;
    let current = true;
    createQrDataUrl(link.shortUrl).then((url) => current && setQr(url));
    return () => {
      current = false;
    };
  }, [link?.shortUrl]);

  return (
    <Modal
      opened={link !== null}
      onClose={onClose}
      title={t("links.qr")}
      size="auto"
    >
      {link && (
        <Stack align="center" gap="md">
          <Paper bg="white" p={6} radius="md" withBorder w={252} h={252}>
            {qr && (
              <Image
                src={qr}
                alt={t("home.form.qrAlt", { url: link.shortUrl })}
                w={240}
                h={240}
              />
            )}
          </Paper>
          <Text size="sm" c="dimmed">
            {displayUrl(link.shortUrl)}
          </Text>
          <Button
            leftSection={<IconDownload size={16} />}
            disabled={!qr}
            onClick={() => qr && downloadQrPng(qr, `qr-${link.shortCode}`)}
          >
            {t("home.form.downloadQr")}
          </Button>
        </Stack>
      )}
    </Modal>
  );
}
