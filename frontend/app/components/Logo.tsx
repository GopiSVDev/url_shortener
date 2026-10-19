import { Link } from "react-router";
import { site } from "~/config/site";
import { useI18n } from "~/lib/i18n/i18n";

/** Three bars getting shorter: a long link turning into a short one. Same drawing as favicon.svg. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <g fill="var(--accent-ink)">
        <rect x="7" y="9" width="18" height="3.5" rx="1.75" />
        <rect x="7" y="14.25" width="12" height="3.5" rx="1.75" />
        <rect x="7" y="19.5" width="6" height="3.5" rx="1.75" />
      </g>
      <circle cx="22" cy="21.25" r="2.4" fill="var(--marigold-c)" />
    </svg>
  );
}

/** Logo linking to the homepage. */
export function Logo({ onClick }: { onClick?: () => void }) {
  const { localize } = useI18n();
  return (
    <Link
      to={localize("/")}
      onClick={onClick}
      aria-label={site.name}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        textDecoration: "none",
        fontWeight: 750,
        fontSize: 19,
        letterSpacing: "-0.03em",
      }}
    >
      <LogoMark />
      <span>{site.name}</span>
    </Link>
  );
}
