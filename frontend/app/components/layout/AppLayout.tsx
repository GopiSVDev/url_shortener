import { useEffect, useState, type ReactNode } from "react";
import {
  ActionIcon,
  Box,
  Burger,
  Button,
  Divider,
  Drawer,
  Flex,
  Group,
  Text,
} from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { Link, useLocation, useMatches } from "react-router";
import { surface } from "~/app-theme";
import { ColorSchemeToggle } from "~/components/ColorSchemeToggle";
import { Logo } from "~/components/Logo";
import { site } from "~/config/site";
import { useI18n } from "~/lib/i18n/i18n";
import type { MessageKey } from "~/lib/i18n/locales";
import { useRootData } from "~/lib/root-data";
import { SIDEBAR_COOKIE } from "~/lib/sidebar";
import { Sidebar } from "./Sidebar";

export type RouteHandle = { title?: MessageKey };

const SIDEBAR_WIDTH = 256;
const SIDEBAR_RAIL_WIDTH = 68;
const BORDER = "1px solid var(--mantine-color-default-border)";

function usePageTitle() {
  const { t } = useI18n();
  const handle = useMatches()
    .map((match) => match.handle as RouteHandle | undefined)
    .reverse()
    .find((handle) => handle?.title);
  return handle?.title ? t(handle.title) : null;
}

export function AppLayout({
  children,
  title: titleOverride,
}: {
  children: ReactNode;
  /** Top-bar title when no route handle provides one, e.g. in error boundaries. */
  title?: string;
}) {
  const { t, localize } = useI18n();
  const { user, sidebarCollapsed } = useRootData();
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);
  const [drawerOpened, drawer] = useDisclosure(false);
  const { pathname } = useLocation();
  const title = titleOverride ?? usePageTitle();

  useEffect(() => drawer.close(), [pathname]);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);

    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }

  useHotkeys([["mod+B", toggleSidebar]]);

  return (
    <Flex flex={1} mih="100dvh" bg={surface.canvas}>
      <Box
        component="aside"
        display={{ base: "none", sm: "block" }}
        pos="sticky"
        top={0}
        h="100dvh"
        w={collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH}
        style={{
          flexShrink: 0,
          overflow: "hidden",
          transition: "width 200ms ease",
        }}
      >
        <Sidebar collapsed={collapsed} />
      </Box>

      <Drawer
        opened={drawerOpened}
        onClose={drawer.close}
        size={280}
        padding={0}
        withCloseButton={false}
      >
        <Sidebar onNavigate={drawer.close} />
      </Drawer>

      <Flex
        direction="column"
        flex={1}
        miw={0}
        bg="var(--mantine-color-body)"
        my={{ base: 0, sm: 8 }}
        mr={{ base: 0, sm: 8 }}
        bd={{ base: "none", sm: BORDER }}
        bdrs={{ base: 0, sm: "var(--mantine-radius-lg)" }}
        style={{ boxShadow: "var(--mantine-shadow-xs)" }}
      >
        <Group
          component="header"
          gap={8}
          wrap="nowrap"
          h={56}
          px={12}
          pos="sticky"
          top={0}
          bg="var(--mantine-color-body)"
          style={{
            zIndex: 10,
            borderBottom: BORDER,
            borderStartStartRadius: "inherit",
            borderStartEndRadius: "inherit",
          }}
        >
          <Burger
            hiddenFrom="sm"
            size="sm"
            opened={drawerOpened}
            onClick={drawer.open}
            aria-label={t("nav.openMenu")}
          />
          <ActionIcon
            visibleFrom="sm"
            variant="subtle"
            color="gray"
            size="lg"
            onClick={toggleSidebar}
            aria-label={t("nav.toggleSidebar")}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <IconLayoutSidebarLeftExpand size={20} stroke={1.75} />
            ) : (
              <IconLayoutSidebarLeftCollapse size={20} stroke={1.75} />
            )}
          </ActionIcon>

          <Box hiddenFrom="sm">
            <Logo />
          </Box>
          {title && (
            <Group visibleFrom="sm" gap="sm" wrap="nowrap">
              <Divider
                orientation="vertical"
                h={20}
                style={{ alignSelf: "center" }}
              />
              <Text fw={500} truncate>
                {title}
              </Text>
            </Group>
          )}

          <Group gap={4} ml="auto" wrap="nowrap">
            {!user && (
              <Button
                hiddenFrom="sm"
                component={Link}
                to={localize("/login")}
                variant="default"
                size="xs"
              >
                {t("nav.login")}
              </Button>
            )}
            <ColorSchemeToggle />
          </Group>
        </Group>

        <Box component="main" flex={1}>
          {children}
        </Box>

        <Box component="footer" py="md" px="lg" style={{ borderTop: BORDER }}>
          <Text size="sm" c="dimmed">
            {t("footer.copyright", {
              year: new Date().getFullYear(),
              name: site.name,
            })}
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}
