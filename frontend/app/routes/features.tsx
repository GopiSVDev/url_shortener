import {
  IconCalendarTime,
  IconChartBar,
  IconLink,
  IconListDetails,
  IconPencil,
  IconQrcode,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { Seo } from "~/components/Seo";
import type { LabelColor } from "~/lib/color";
import { useI18n } from "~/lib/i18n/i18n";
import styles from "./features.module.css";

const items = [
  { key: "shorten", icon: IconLink, color: "tomato" },
  { key: "qr", icon: IconQrcode, color: "plum" },
  { key: "analytics", icon: IconChartBar, color: "cobalt" },
  { key: "alias", icon: IconPencil, color: "jade" },
  { key: "expiry", icon: IconCalendarTime, color: "marigold" },
  { key: "manage", icon: IconListDetails, color: "tomato" },
] as const satisfies readonly { key: string; icon: unknown; color: LabelColor }[];

export default function Features() {
  const { t, localize } = useI18n();

  return (
    <div className="page">
      <Seo
        title={t("meta.featuresTitle")}
        description={t("meta.featuresDescription")}
      />

      <header className={styles.intro}>
        <h1>{t("features.title")}</h1>
        <p>{t("features.subtitle")}</p>
      </header>

      <div className={styles.grid}>
        {items.map(({ key, icon: Icon, color }) => (
          <section
            key={key}
            data-color={color}
            className={styles.item}
            aria-labelledby={`feature-${key}`}
          >
            <span className={styles.icon}>
              <Icon size={22} stroke={1.75} aria-hidden />
            </span>
            <div>
              <h2 id={`feature-${key}`}>{t(`features.items.${key}.title`)}</h2>
              <p>{t(`features.items.${key}.text`)}</p>
            </div>
          </section>
        ))}
      </div>

      <aside className={styles.cta}>
        <div>
          <h2>{t("features.cta.title")}</h2>
          <p>{t("features.cta.text")}</p>
        </div>
        <div className={styles.ctaActions}>
          <Link to={localize("/register")} className="btn">
            {t("features.cta.secondary")}
          </Link>
          <Link to={localize("/")} className="btn btn-primary">
            {t("features.cta.primary")}
          </Link>
        </div>
      </aside>
    </div>
  );
}
