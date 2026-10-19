import { useEffect, useState } from "react";
import {
  IconAdjustmentsHorizontal,
  IconAlertCircle,
  IconArrowRight,
  IconChartBar,
  IconChevronDown,
  IconDownload,
} from "@tabler/icons-react";
import { Link, useFetcher } from "react-router";
import { useI18n } from "~/lib/i18n/i18n";
import { useRootData } from "~/lib/root-data";
import { CopyLinkButton } from "./CopyLinkButton";
import { ShortUrl } from "./ShortUrl";
import { useQrCode, downloadQrPng } from "./qr";
import type { Link as ShortLink } from "~/.server/links/links-api";
import type { LinkFormErrors } from "~/.server/links/link-form";
import styles from "./ShortenForm.module.css";

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
  const busy = fetcher.state !== "idle";

  useEffect(() => setEdited(new Set()), [fetcher.data]);

  // Open the options when the server rejected one of them
  useEffect(() => {
    if (errors?.alias || errors?.expiresAt) setOptionsOpen(true);
  }, [errors]);

  const error = (field: keyof LinkFormErrors) => {
    const key = errors?.[field];
    return key && !edited.has(field) ? t(key) : undefined;
  };
  const onEdit = (field: string) => () =>
    setEdited((prev) => new Set(prev).add(field));

  const urlError = error("url");
  const aliasError = error("alias");
  const expiresError = error("expiresAt");

  return (
    <section className={styles.wrap}>
      <fetcher.Form method="post" noValidate className={`card ${styles.form}`}>
        {error("form") && (
          <div className="alert" role="alert" style={{ marginBottom: 12 }}>
            <IconAlertCircle size={18} />
            {error("form")}
          </div>
        )}

        <div className={styles.row}>
          <label htmlFor="url" className="visually-hidden">
            {t("home.form.label")}
          </label>
          <input
            id="url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            className={`input ${styles.urlInput}`}
            placeholder={t("home.form.placeholder")}
            aria-invalid={urlError ? true : undefined}
            aria-describedby={urlError ? "url-error" : undefined}
            onChange={onEdit("url")}
          />
          <button
            type="submit"
            className={`btn btn-primary btn-lg ${styles.submit}`}
            disabled={busy}
          >
            {busy ? (
              <span className="spinner" aria-hidden />
            ) : (
              <IconArrowRight size={18} stroke={2.25} />
            )}
            {t("home.form.submit")}
          </button>
        </div>
        {urlError && (
          <p id="url-error" className="field-error" style={{ marginTop: 8 }}>
            {urlError}
          </p>
        )}

        <button
          type="button"
          className={styles.optionsToggle}
          onClick={() => setOptionsOpen((open) => !open)}
          aria-expanded={optionsOpen}
          aria-controls="link-options"
        >
          <IconAdjustmentsHorizontal size={16} />
          {t("home.form.options")}
          <IconChevronDown
            size={15}
            style={{
              transform: optionsOpen ? "rotate(180deg)" : undefined,
              transition: "transform 150ms ease",
            }}
          />
        </button>

        {/* hidden, not unmounted, so the option fields are submitted even when closed */}
        <div id="link-options" className={styles.options} hidden={!optionsOpen}>
          <div className="field">
            <label htmlFor="alias" className="field-label">
              {t("links.alias")}
            </label>
            <div className={styles.aliasInput}>
              <span aria-hidden>/</span>
              <input
                id="alias"
                name="alias"
                className="input mono"
                placeholder="spring-26"
                maxLength={30}
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={aliasError ? true : undefined}
                onChange={onEdit("alias")}
              />
            </div>
            {aliasError ? (
              <p className="field-error">{aliasError}</p>
            ) : (
              <p className="field-hint">{t("links.aliasHint")}</p>
            )}
          </div>
          <div className="field">
            <label htmlFor="expiresAt" className="field-label">
              {t("links.expiresAt")}
            </label>
            <input
              id="expiresAt"
              name="expiresAt"
              type="datetime-local"
              className="input"
              aria-invalid={expiresError ? true : undefined}
              onChange={onEdit("expiresAt")}
            />
            {expiresError ? (
              <p className="field-error">{expiresError}</p>
            ) : (
              <p className="field-hint">{t("links.expiresHint")}</p>
            )}
          </div>
        </div>
      </fetcher.Form>

      <div aria-live="polite">
        {link && <ShortenResult key={link.shortCode} link={link} />}
      </div>
    </section>
  );
}

function ShortenResult({ link }: { link: ShortLink }) {
  const { t, localize } = useI18n();
  const { user } = useRootData();
  const qr = useQrCode(link.shortUrl);

  return (
    <div className={styles.ticket}>
      <div className={styles.ticketMain}>
        <p className="eyebrow">{t("home.form.result")}</p>
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noreferrer"
          className={styles.shortUrl}
        >
          <ShortUrl url={link.shortUrl} />
        </a>
        <p className={`${styles.original} truncate`} title={link.originalUrl}>
          {link.originalUrl}
        </p>
        <div className={styles.actions}>
          <CopyLinkButton value={link.shortUrl} primary />
          <button
            type="button"
            className="btn btn-sm"
            disabled={!qr}
            onClick={() => qr && downloadQrPng(qr, `qr-${link.shortCode}`)}
          >
            <IconDownload size={15} />
            {t("common.downloadQr")}
          </button>
          {user && (
            <Link
              to={localize(`/links/${link.shortCode}`)}
              className="btn btn-sm"
            >
              <IconChartBar size={15} />
              {t("links.viewStats")}
            </Link>
          )}
        </div>
        <p className={styles.note}>
          {user ? (
            <>
              {t("home.form.saved")}{" "}
              <Link to={localize("/links")}>{t("home.form.savedCta")}</Link>
            </>
          ) : (
            <>
              {t("home.form.anonymous")}{" "}
              <Link to={localize("/register")}>
                {t("home.form.anonymousCta")}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className={styles.ticketStub}>
        {/* Always white behind the code so it scans in dark mode too */}
        <div className={styles.qr}>
          {qr && (
            <img
              src={qr}
              alt={t("common.qrAlt", { url: link.shortUrl })}
              width={150}
              height={150}
            />
          )}
        </div>
      </div>
    </div>
  );
}
