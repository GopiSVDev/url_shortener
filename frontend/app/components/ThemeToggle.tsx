import { IconMoon, IconSun } from "@tabler/icons-react";
import { useI18n } from "~/lib/i18n/i18n";
import { getTheme, setTheme } from "~/lib/theme";

export function ThemeToggle() {
  const { t } = useI18n();

  // Both icons render; CSS shows the one for the current theme, so the server needs no theme
  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      aria-label={t("nav.toggleTheme")}
      title={t("nav.toggleTheme")}
      onClick={() => setTheme(getTheme() === "dark" ? "light" : "dark")}
    >
      <IconSun size={19} stroke={1.75} data-show="dark" />
      <IconMoon size={19} stroke={1.75} data-show="light" />
    </button>
  );
}
