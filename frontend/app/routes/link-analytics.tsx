import { useState } from "react";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";
import { data, Link } from "react-router";
import type { Route } from "./+types/link-analytics";
import { ApiError } from "~/.server/api";
import { Seo } from "~/components/Seo";
import { authContext, requireUser } from "~/.server/auth/session";
import { formatDate, formatDateTime } from "~/features/links/format";
import { getAnalytics, type LinkAnalytics } from "~/.server/links/links-api";
import type { LabelColor } from "~/lib/color";
import { useI18n } from "~/lib/i18n/i18n";
import type { MessageKey } from "~/lib/i18n/locales";
import styles from "./link-analytics.module.css";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

const PERIODS = ["7", "30", "90"];

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const requested = new URL(request.url).searchParams.get("days") ?? "30";
  const days = PERIODS.includes(requested) ? Number(requested) : 30;

  try {
    const token = context.get(authContext).accessToken!;
    return { stats: await getAnalytics(params.code, days, token) };
  } catch (error) {
    // Someone else's link looks the same as a missing one
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      throw data(null, { status: 404 });
    }
    throw error;
  }
}

export default function LinkAnalyticsPage({
  loaderData,
}: Route.ComponentProps) {
  const { t, locale, localize } = useI18n();
  const { stats } = loaderData;

  return (
    <div className="page">
      <Seo
        title={t("meta.analyticsTitle", { code: stats.shortCode })}
        noIndex
      />

      <Link to={localize("/links")} className={styles.back}>
        <IconArrowLeft size={16} />
        {t("analytics.back")}
      </Link>

      <header className={styles.head}>
        <div className={styles.headText}>
          <h1 className="mono">/{stats.shortCode}</h1>
          <a
            href={stats.originalUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.dest}
            title={stats.originalUrl}
          >
            <span className="truncate">{stats.originalUrl}</span>
            <IconExternalLink size={14} />
          </a>
        </div>

        <nav className={styles.periods} aria-label={t("analytics.period")}>
          {PERIODS.map((days) => (
            <Link
              key={days}
              to={`?days=${days}`}
              replace
              preventScrollReset
              aria-current={String(stats.days) === days ? "page" : undefined}
            >
              {t("analytics.lastDays", { days })}
            </Link>
          ))}
        </nav>
      </header>

      <dl className={styles.tiles}>
        <Tile
          color="tomato"
          label={t("analytics.periodClicks")}
          value={stats.periodClicks.toLocaleString(locale)}
        />
        <Tile
          color="jade"
          label={t("analytics.uniqueVisitors")}
          value={stats.uniqueVisitors.toLocaleString(locale)}
        />
        <Tile
          color="cobalt"
          label={t("analytics.totalClicks")}
          value={stats.totalClicks.toLocaleString(locale)}
        />
        <Tile
          color="marigold"
          label={t("analytics.lastClick")}
          value={
            stats.lastClickedAt
              ? formatDateTime(stats.lastClickedAt, locale)
              : t("analytics.never")
          }
          small
        />
      </dl>

      <section className={`card ${styles.panel}`}>
        <ClicksChart
          days={stats.clicksPerDay}
          total={stats.periodClicks}
          botClicks={stats.botClicks}
        />
      </section>

      <div className={styles.breakdowns}>
        <Breakdown
          title="analytics.referrers"
          color="tomato"
          items={stats.referrers}
          total={stats.periodClicks}
        />
        <Breakdown
          title="analytics.browsers"
          color="cobalt"
          items={stats.browsers}
          total={stats.periodClicks}
        />
        <Breakdown
          title="analytics.operatingSystems"
          color="jade"
          items={stats.operatingSystems}
          total={stats.periodClicks}
        />
        <Breakdown
          title="analytics.devices"
          color="plum"
          items={stats.devices}
          total={stats.periodClicks}
        />
      </div>
    </div>
  );
}

function Tile({
  color,
  label,
  value,
  small,
}: {
  color: LabelColor;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className={styles.tile} data-color={color}>
      <dt>{label}</dt>
      <dd data-small={small || undefined}>{value}</dd>
    </div>
  );
}

function ClicksChart({
  days,
  total,
  botClicks,
}: {
  days: LinkAnalytics["clicksPerDay"];
  total: number;
  botClicks: number;
}) {
  const { t, locale } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((day) => day.clicks));
  const hovered = active === null ? null : days[active];
  const middle = Math.floor((days.length - 1) / 2);

  return (
    <>
      <div className={styles.chartHead}>
        <h2>{t("analytics.clicksPerDay")}</h2>
        {/* The readout doubles as the tooltip: hovered day, or the period total */}
        <p className={styles.readout} aria-live="polite">
          {hovered ? (
            <>
              <b>{hovered.clicks.toLocaleString(locale)}</b>{" "}
              {t("analytics.clicksOn", { date: formatDate(hovered.date, locale) })}
            </>
          ) : (
            <>
              <b>{total.toLocaleString(locale)}</b>{" "}
              {t("analytics.clicksInPeriod", { days: days.length })}
            </>
          )}
        </p>
      </div>

      <div className={styles.chart} onMouseLeave={() => setActive(null)}>
        <span className={styles.maxLine} data-value={max.toLocaleString(locale)} />
        <div
          className={styles.bars}
          data-dense={days.length > 31 || undefined}
          aria-hidden
        >
          {days.map((day, i) => (
            <div
              key={day.date}
              className={styles.col}
              data-active={active === i || undefined}
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <div
                className={styles.bar}
                data-zero={day.clicks === 0 || undefined}
                style={{
                  height: day.clicks
                    ? `max(4px, ${(day.clicks / max) * 100}%)`
                    : undefined,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.axis} aria-hidden>
        <span>{formatDate(days[0].date, locale)}</span>
        <span>{formatDate(days[middle].date, locale)}</span>
        <span>{formatDate(days[days.length - 1].date, locale)}</span>
      </div>

      {/* Same data for screen readers */}
      <table className="visually-hidden">
        <caption>{t("analytics.clicksPerDay")}</caption>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <th scope="row">{formatDate(day.date, locale)}</th>
              <td>{day.clicks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {botClicks > 0 && (
        <p className={styles.footnote}>
          {t("analytics.botsExcluded", { count: botClicks })}
        </p>
      )}
    </>
  );
}

function Breakdown({
  title,
  color,
  items,
  total,
}: {
  title: MessageKey;
  color: LabelColor;
  items: LinkAnalytics["referrers"];
  total: number;
}) {
  const { t, locale } = useI18n();
  return (
    <section className={`card ${styles.panel}`} data-color={color}>
      <h2 className={styles.panelTitle}>{t(title)}</h2>
      {items.length === 0 ? (
        <p className={styles.noData}>{t("analytics.noData")}</p>
      ) : (
        <ul className={styles.breakdown}>
          {items.map((item) => {
            const share = total ? (item.clicks / total) * 100 : 0;
            return (
              <li key={item.name}>
                <div className={styles.breakdownRow}>
                  <span className="truncate">{item.name}</span>
                  <span className={styles.breakdownValue}>
                    {item.clicks.toLocaleString(locale)}
                    <small>{Math.round(share)}%</small>
                  </span>
                </div>
                <div className={styles.track}>
                  <div style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
