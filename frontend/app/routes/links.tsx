import { useEffect, useMemo, useState } from "react";
import {
  IconAlertCircle,
  IconChartBar,
  IconDownload,
  IconPencil,
  IconPlus,
  IconQrcode,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { data, Link, useFetcher } from "react-router";
import type { Route } from "./+types/links";
import { parseForm } from "~/.server/form";
import { Dialog } from "~/components/Dialog";
import { Seo } from "~/components/Seo";
import { authContext, requireUser } from "~/.server/auth/session";
import { CopyIconButton } from "~/features/links/CopyLinkButton";
import { ShortUrl } from "~/features/links/ShortUrl";
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
import { downloadQrPng, useQrCode } from "~/features/links/qr";
import { colorFor } from "~/lib/color";
import { useI18n } from "~/lib/i18n/i18n";
import styles from "./links.module.css";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

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

type Sort = "newest" | "clicks" | "az";

const isExpired = (link: ShortLink, now: number) =>
  link.expirationDate !== null &&
  new Date(`${link.expirationDate}Z`).getTime() <= now;

export default function Links({ loaderData }: Route.ComponentProps) {
  const { t, locale, localize } = useI18n();
  const { links, now } = loaderData;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [editing, setEditing] = useState<ShortLink | null>(null);
  const [deleting, setDeleting] = useState<ShortLink | null>(null);
  const [qrFor, setQrFor] = useState<ShortLink | null>(null);

  const totalClicks = links.reduce((sum, l) => sum + (l.clickCount ?? 0), 0);
  const expiredCount = links.filter((l) => isExpired(l, now)).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? links.filter(
          (l) =>
            l.shortCode.toLowerCase().includes(q) ||
            l.originalUrl.toLowerCase().includes(q),
        )
      : links;
    return [...matches].sort((a, b) => {
      if (sort === "clicks") return (b.clickCount ?? 0) - (a.clickCount ?? 0);
      if (sort === "az") return a.shortCode.localeCompare(b.shortCode);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [links, query, sort]);

  return (
    <div className="page">
      <Seo title={t("meta.linksTitle")} noIndex />

      <header className={styles.head}>
        <div>
          <h1>{t("links.title")}</h1>
          <p className="muted">{t("links.subtitle")}</p>
        </div>
        <Link to={localize("/")} className="btn btn-primary">
          <IconPlus size={17} stroke={2.25} />
          {t("links.new")}
        </Link>
      </header>

      <dl className={styles.stats}>
        <div data-color="tomato">
          <dt>{t("links.stats.links")}</dt>
          <dd>{links.length.toLocaleString(locale)}</dd>
        </div>
        <div data-color="cobalt">
          <dt>{t("links.stats.clicks")}</dt>
          <dd>{totalClicks.toLocaleString(locale)}</dd>
        </div>
        <div data-color="jade">
          <dt>{t("links.stats.active")}</dt>
          <dd>{(links.length - expiredCount).toLocaleString(locale)}</dd>
        </div>
      </dl>

      {links.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyArt} aria-hidden>
            <span data-color="tomato" />
            <span data-color="marigold" />
            <span data-color="jade" />
          </div>
          <h2>{t("links.emptyTitle")}</h2>
          <p className="muted">{t("links.emptyText")}</p>
          <Link to={localize("/")} className="btn btn-primary">
            {t("links.new")}
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <IconSearch size={17} aria-hidden />
              <input
                type="search"
                className="input"
                placeholder={t("links.search")}
                aria-label={t("links.search")}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
            </div>
            <select
              className="input"
              aria-label={t("links.sort.label")}
              value={sort}
              onChange={(event) => setSort(event.currentTarget.value as Sort)}
              style={{ width: "auto" }}
            >
              <option value="newest">{t("links.sort.newest")}</option>
              <option value="clicks">{t("links.sort.clicks")}</option>
              <option value="az">{t("links.sort.az")}</option>
            </select>
          </div>

          {visible.length === 0 ? (
            <p className={styles.noMatch}>
              {t("links.noMatch", { query: query.trim() })}
            </p>
          ) : (
            <ul className={styles.list}>
              {visible.map((link) => (
                <LinkRow
                  key={link.shortCode}
                  link={link}
                  expired={isExpired(link, now)}
                  onEdit={() => setEditing(link)}
                  onDelete={() => setDeleting(link)}
                  onQr={() => setQrFor(link)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t("links.edit")}
      >
        {editing && <EditForm link={editing} onClose={() => setEditing(null)} />}
      </Dialog>
      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("links.deleteTitle")}
        width={420}
      >
        {deleting && (
          <DeleteForm link={deleting} onClose={() => setDeleting(null)} />
        )}
      </Dialog>
      <Dialog
        open={qrFor !== null}
        onClose={() => setQrFor(null)}
        title={t("links.qr")}
        width={360}
      >
        {qrFor && <QrPanel link={qrFor} />}
      </Dialog>
    </div>
  );
}

function LinkRow({
  link,
  expired,
  onEdit,
  onDelete,
  onQr,
}: {
  link: ShortLink;
  expired: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onQr: () => void;
}) {
  const { t, locale, localize } = useI18n();
  const destination = safeUrl(link.originalUrl);
  const clicks = link.clickCount ?? 0;

  return (
    <li
      className={styles.row}
      data-color={colorFor(link.shortCode)}
      data-expired={expired || undefined}
    >
      <div className={styles.rowMain}>
        <div className={styles.rowTitle}>
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.short}
          >
            <ShortUrl url={link.shortUrl} />
          </a>
          {expired && (
            <span className="badge" data-tone="danger">
              {t("links.expired")}
            </span>
          )}
        </div>
        <p className={`${styles.dest} truncate`} title={link.originalUrl}>
          {destination ? (
            <>
              <b>{destination.host}</b>
              {destination.rest}
            </>
          ) : (
            link.originalUrl
          )}
        </p>
        <p className={styles.meta}>
          {t("links.created", { date: formatDate(link.createdAt, locale) })}
          {link.expirationDate &&
            !expired &&
            ` · ${t("links.expires", { date: formatDateTime(link.expirationDate, locale) })}`}
        </p>
      </div>

      <Link
        to={localize(`/links/${link.shortCode}`)}
        className={styles.clicks}
        aria-label={t("links.clicksLabel", { count: clicks })}
      >
        <span className={styles.clicksValue}>
          {clicks.toLocaleString(locale)}
        </span>
        <span className={styles.clicksUnit}>
          <IconChartBar size={13} />
          {t("links.clicksUnit")}
        </span>
      </Link>

      <div className={styles.actions}>
        <CopyIconButton value={link.shortUrl} />
        <button
          type="button"
          className="icon-btn"
          onClick={onQr}
          aria-label={t("links.qr")}
          title={t("links.qr")}
        >
          <IconQrcode size={17} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onEdit}
          aria-label={t("links.edit")}
          title={t("links.edit")}
        >
          <IconPencil size={17} />
        </button>
        <button
          type="button"
          className="icon-btn"
          data-tone="danger"
          onClick={onDelete}
          aria-label={t("links.delete")}
          title={t("links.delete")}
        >
          <IconTrash size={17} />
        </button>
      </div>
    </li>
  );
}

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    const rest = url.pathname + url.search + url.hash;
    return { host: url.host, rest: rest === "/" ? "" : rest };
  } catch {
    return null;
  }
}

/** Closes the dialog once its form was saved. */
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
    <div className="alert" role="alert">
      <IconAlertCircle size={18} />
      {t(errors.form)}
    </div>
  );
}

function EditForm({ link, onClose }: { link: ShortLink; onClose: () => void }) {
  const { t } = useI18n();
  const fetcher = useSubmitAndClose(onClose);
  const errors = fetcher.data?.ok === false ? fetcher.data.errors : null;

  return (
    <fetcher.Form method="post" noValidate className={styles.dialogForm}>
      <input type="hidden" name="intent" value="update" />
      <input type="hidden" name="code" value={link.shortCode} />
      <FormError errors={errors} />
      <p className={styles.dialogCode}>
        <ShortUrl url={link.shortUrl} />
      </p>
      <div className="field">
        <label htmlFor="edit-url" className="field-label">
          {t("home.form.label")}
        </label>
        <input
          id="edit-url"
          name="url"
          className="input"
          defaultValue={link.originalUrl}
          aria-invalid={errors?.url ? true : undefined}
          autoFocus
        />
        {errors?.url && <p className="field-error">{t(errors.url)}</p>}
      </div>
      <div className="field">
        <label htmlFor="edit-expires" className="field-label">
          {t("links.expiresAt")}
        </label>
        <input
          id="edit-expires"
          name="expiresAt"
          type="datetime-local"
          className="input"
          defaultValue={toDateTimeInput(link.expirationDate)}
          aria-invalid={errors?.expiresAt ? true : undefined}
        />
        {errors?.expiresAt ? (
          <p className="field-error">{t(errors.expiresAt)}</p>
        ) : (
          <p className="field-hint">{t("links.expiresEditHint")}</p>
        )}
      </div>
      <div className={styles.dialogActions}>
        <button type="button" className="btn" onClick={onClose}>
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={fetcher.state !== "idle"}
        >
          {fetcher.state !== "idle" && <span className="spinner" aria-hidden />}
          {t("common.save")}
        </button>
      </div>
    </fetcher.Form>
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
    <fetcher.Form method="post" className={styles.dialogForm}>
      <input type="hidden" name="intent" value="delete" />
      <input type="hidden" name="code" value={link.shortCode} />
      <FormError errors={errors} />
      <p className="muted">
        {t("links.deleteText", { link: displayUrl(link.shortUrl) })}
      </p>
      <div className={styles.dialogActions}>
        <button type="button" className="btn" onClick={onClose} autoFocus>
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          className="btn btn-danger"
          disabled={fetcher.state !== "idle"}
        >
          {fetcher.state !== "idle" && <span className="spinner" aria-hidden />}
          {t("links.delete")}
        </button>
      </div>
    </fetcher.Form>
  );
}

function QrPanel({ link }: { link: ShortLink }) {
  const { t } = useI18n();
  const qr = useQrCode(link.shortUrl);

  return (
    <div className={styles.qrPanel}>
      <div className={styles.qr}>
        {qr && (
          <img
            src={qr}
            alt={t("common.qrAlt", { url: link.shortUrl })}
            width={240}
            height={240}
          />
        )}
      </div>
      <p>
        <ShortUrl url={link.shortUrl} />
      </p>
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={!qr}
        onClick={() => qr && downloadQrPng(qr, `qr-${link.shortCode}`)}
      >
        <IconDownload size={17} />
        {t("common.downloadQr")}
      </button>
    </div>
  );
}
