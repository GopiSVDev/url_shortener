import {
  Anchor,
  Box,
  Container,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { data, Link, useNavigate } from "react-router";
import type { Route } from "./+types/link-analytics";
import { ApiError } from "~/.server/api";
import { accent } from "~/app-theme";
import type { RouteHandle } from "~/components/layout/AppLayout";
import { Seo } from "~/components/Seo";
import { authContext, requireUser } from "~/.server/auth/session";
import { formatDate, formatDateTime } from "~/features/links/format";
import { getAnalytics, type LinkAnalytics } from "~/.server/links/links-api";
import { useI18n } from "~/lib/i18n/i18n";
import type { MessageKey } from "~/lib/i18n/locales";

export const middleware: Route.MiddlewareFunction[] = [requireUser];

export const handle: RouteHandle = { title: "nav.analytics" };

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
  const navigate = useNavigate();
  const { stats } = loaderData;

  return (
    <Container size="lg" py={{ base: 32, sm: 48 }}>
      <Seo
        title={t("meta.analyticsTitle", { code: stats.shortCode })}
        noIndex
      />

      <Anchor component={Link} to={localize("/links")} size="sm" c="dimmed">
        <Group gap={4}>
          <IconArrowLeft size={14} />
          {t("analytics.back")}
        </Group>
      </Anchor>

      <Group justify="space-between" align="flex-end" mt="sm" mb="lg">
        <Box miw={0}>
          <Title order={1} fz={{ base: 26, sm: 30 }}>
            /{stats.shortCode}
          </Title>
          <Text c="dimmed" size="sm" truncate title={stats.originalUrl}>
            {stats.originalUrl}
          </Text>
        </Box>
        <SegmentedControl
          value={String(stats.days)}
          onChange={(days) =>
            navigate(`?days=${days}`, { preventScrollReset: true })
          }
          data={PERIODS.map((days) => ({
            value: days,
            label: t("analytics.lastDays", { days }),
          }))}
        />
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        <Stat label={t("analytics.periodClicks")} value={stats.periodClicks} />
        <Stat
          label={t("analytics.uniqueVisitors")}
          value={stats.uniqueVisitors}
        />
        <Stat label={t("analytics.totalClicks")} value={stats.totalClicks} />
        <Stat
          label={t("analytics.lastClick")}
          value={
            stats.lastClickedAt
              ? formatDateTime(stats.lastClickedAt, locale)
              : t("analytics.never")
          }
          small
        />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md" mt="sm">
        <Text fw={600} mb="md">
          {t("analytics.clicksPerDay")}
        </Text>
        <ClicksChart days={stats.clicksPerDay} />
        {stats.botClicks > 0 && (
          <Text size="xs" c="dimmed" mt="sm">
            {t("analytics.botsExcluded", { count: stats.botClicks })}
          </Text>
        )}
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="sm">
        <Breakdown
          title="analytics.referrers"
          items={stats.referrers}
          total={stats.periodClicks}
        />
        <Breakdown
          title="analytics.browsers"
          items={stats.browsers}
          total={stats.periodClicks}
        />
        <Breakdown
          title="analytics.operatingSystems"
          items={stats.operatingSystems}
          total={stats.periodClicks}
        />
        <Breakdown
          title="analytics.devices"
          items={stats.devices}
          total={stats.periodClicks}
        />
      </SimpleGrid>
    </Container>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: number | string;
  small?: boolean;
}) {
  const { locale } = useI18n();
  return (
    <Paper withBorder radius="md" p="md">
      <Text size="xs" c="dimmed" fw={500} tt="uppercase">
        {label}
      </Text>
      <Text fw={700} fz={small ? "md" : 28} mt={4} lh={1.2}>
        {typeof value === "number" ? value.toLocaleString(locale) : value}
      </Text>
    </Paper>
  );
}

function ClicksChart({ days }: { days: LinkAnalytics["clicksPerDay"] }) {
  const { t, locale } = useI18n();
  const max = Math.max(1, ...days.map((day) => day.clicks));
  const gap = days.length > 31 ? 1 : 3;

  return (
    <>
      <Group h={160} gap={gap} align="flex-end" wrap="nowrap">
        {days.map((day) => (
          <Tooltip
            key={day.date}
            label={t("analytics.dayTooltip", {
              date: formatDate(day.date, locale),
              count: day.clicks,
            })}
          >
            <Box
              flex={1}
              h={`${Math.max((day.clicks / max) * 100, day.clicks ? 2 : 0.5)}%`}
              bg={day.clicks ? accent : "var(--mantine-color-default-border)"}
              style={{ borderRadius: 2, minWidth: 1 }}
            />
          </Tooltip>
        ))}
      </Group>
      <Group justify="space-between" mt={6}>
        <Text size="xs" c="dimmed">
          {formatDate(days[0].date, locale)}
        </Text>
        <Text size="xs" c="dimmed">
          {formatDate(days[days.length - 1].date, locale)}
        </Text>
      </Group>
    </>
  );
}

function Breakdown({
  title,
  items,
  total,
}: {
  title: MessageKey;
  items: LinkAnalytics["referrers"];
  total: number;
}) {
  const { t, locale } = useI18n();
  return (
    <Paper withBorder radius="md" p="md">
      <Text fw={600} mb="sm">
        {t(title)}
      </Text>
      {items.length === 0 ? (
        <Text size="sm" c="dimmed">
          {t("analytics.noData")}
        </Text>
      ) : (
        <Stack gap="xs">
          {items.map((item) => (
            <div key={item.name}>
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Text size="sm" truncate>
                  {item.name}
                </Text>
                <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                  {item.clicks.toLocaleString(locale)}
                </Text>
              </Group>
              <Progress
                value={total ? (item.clicks / total) * 100 : 0}
                size="sm"
                mt={4}
              />
            </div>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
