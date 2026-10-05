import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  NavLink,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconHome2,
  IconLayoutGrid,
  IconLogin2,
  IconLogout,
  IconUserCircle,
  type Icon,
} from "@tabler/icons-react";
import { Form, Link, useLocation } from "react-router";
import { LanguageSwitcher } from "~/components/LanguageSwitcher";
import { Logo } from "~/components/Logo";
import { useI18n } from "~/lib/i18n/i18n";
import type { MessageKey } from "~/lib/i18n/locales";
import { useRootData } from "~/lib/root-data";

type NavItem = { to: string; label: MessageKey; icon: Icon };

type SidebarProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const { t, localize } = useI18n();
  const { user } = useRootData();
  const { pathname } = useLocation();

  // Add new pages here.
  const items: NavItem[] = [
    { to: "/", label: "nav.home", icon: IconHome2 },
    { to: "/features", label: "nav.features", icon: IconLayoutGrid },
    ...(user
      ? [
          {
            to: "/welcome",
            label: "nav.account",
            icon: IconUserCircle,
          } as const,
        ]
      : []),
  ];

  return (
    <Stack component="nav" h="100%" p={12} gap={8} aria-label={t("nav.main")}>
      <Group
        h={44}
        px={collapsed ? 0 : 8}
        justify={collapsed ? "center" : "flex-start"}
      >
        <Logo withText={!collapsed} onClick={onNavigate} />
      </Group>

      <Stack gap={2} mt={8}>
        {items.map(({ to, label, icon: Icon }) => {
          const href = localize(to);
          const active = pathname === href;
          return (
            <Tooltip
              key={to}
              label={t(label)}
              position="right"
              disabled={!collapsed}
            >
              <NavLink
                component={Link}
                to={href}
                onClick={onNavigate}
                active={active}
                aria-current={active ? "page" : undefined}
                aria-label={collapsed ? t(label) : undefined}
                label={collapsed ? null : t(label)}
                leftSection={<Icon size={20} stroke={1.75} />}
                h={40}
                fw={500}
                styles={{
                  root: {
                    borderRadius: "var(--mantine-radius-md)",
                    justifyContent: collapsed ? "center" : undefined,
                  },
                  section: collapsed ? { marginInlineEnd: 0 } : undefined,
                  body: collapsed ? { display: "none" } : undefined,
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>

      <Stack gap={8} mt="auto" align={collapsed ? "center" : "stretch"}>
        {!collapsed && <LanguageSwitcher />}
        {user ? (
          <UserPanel username={user.username} collapsed={collapsed} />
        ) : collapsed ? (
          <Tooltip label={t("nav.login")} position="right">
            <ActionIcon
              component={Link}
              to={localize("/login")}
              size="lg"
              aria-label={t("nav.login")}
            >
              <IconLogin2 size={18} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            component={Link}
            to={localize("/login")}
            onClick={onNavigate}
            leftSection={<IconLogin2 size={16} />}
            fullWidth
          >
            {t("nav.login")}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

function UserPanel({
  username,
  collapsed,
}: {
  username: string;
  collapsed: boolean;
}) {
  const { t, localize } = useI18n();
  const avatar = (
    <Avatar size={32} radius="xl" color="brand" name={username}>
      {username.charAt(0).toUpperCase()}
    </Avatar>
  );
  const logout = (
    <Form method="post" action={localize("/logout")}>
      <Tooltip label={t("nav.logout")} position="right">
        <ActionIcon
          type="submit"
          variant="subtle"
          color="gray"
          size="lg"
          aria-label={t("nav.logout")}
        >
          <IconLogout size={18} />
        </ActionIcon>
      </Tooltip>
    </Form>
  );

  if (collapsed) {
    return (
      <>
        <Tooltip label={username} position="right">
          {avatar}
        </Tooltip>
        {logout}
      </>
    );
  }

  return (
    <Group gap="sm" wrap="nowrap" px={4}>
      {avatar}
      <Box flex={1} miw={0}>
        <Text size="sm" fw={500} truncate>
          {username}
        </Text>
        <Text size="xs" c="dimmed">
          {t("nav.signedIn")}
        </Text>
      </Box>
      {logout}
    </Group>
  );
}
