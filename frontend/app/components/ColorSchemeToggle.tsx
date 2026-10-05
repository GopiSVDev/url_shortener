import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useI18n } from "~/lib/i18n/i18n";

export function ColorSchemeToggle() {
  const { t } = useI18n();
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      aria-label={t("nav.toggleTheme")}
      onClick={() => setColorScheme(computed === "dark" ? "light" : "dark")}
    >
      <IconSun size={20} stroke={1.75} className="mantine-light-hidden" />
      <IconMoon size={20} stroke={1.75} className="mantine-dark-hidden" />
    </ActionIcon>
  );
}
