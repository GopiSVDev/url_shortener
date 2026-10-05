import { Group, Text } from "@mantine/core";
import { Link } from "react-router";
import { site } from "~/config/site";
import { useI18n } from "~/lib/i18n/i18n";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect
        width="32"
        height="32"
        rx="8"
        fill="var(--mantine-primary-color-filled)"
      />
      <g
        transform="translate(4 4)"
        fill="none"
        stroke="#fff"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 15l6 -6" />
        <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
        <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
      </g>
    </svg>
  );
}

/** Logo linking to the homepage. */
export function Logo({
  withText = true,
  onClick,
}: {
  withText?: boolean;
  onClick?: () => void;
}) {
  const { localize } = useI18n();
  return (
    <Group
      renderRoot={(props) => (
        <Link
          {...props}
          to={localize("/")}
          onClick={onClick}
          aria-label={site.name}
        />
      )}
      gap={8}
      wrap="nowrap"
      c="inherit"
      td="none"
    >
      <LogoMark />
      {withText && (
        <Text component="span" fw={700} fz="lg" lh={1}>
          {site.name}
        </Text>
      )}
    </Group>
  );
}
