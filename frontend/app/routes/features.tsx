import {
  Box,
  Button,
  Container,
  Flex,
  Group,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import {
  IconCalendarTime,
  IconChartLine,
  IconLink,
  IconListDetails,
  IconPencil,
  IconQrcode,
} from "@tabler/icons-react";
import { Link } from "react-router";
import type { RouteHandle } from "~/components/layout/AppLayout";
import { Seo } from "~/components/Seo";
import { useI18n } from "~/lib/i18n/i18n";

export const handle: RouteHandle = { title: "nav.features" };

const items = [
  { key: "shorten", icon: IconLink },
  { key: "qr", icon: IconQrcode },
  { key: "analytics", icon: IconChartLine },
  { key: "alias", icon: IconPencil },
  { key: "expiry", icon: IconCalendarTime },
  { key: "manage", icon: IconListDetails },
] as const;

export default function Features() {
  const { t, localize } = useI18n();

  return (
    <Container size="lg" py={{ base: 40, sm: 72 }}>
      <Seo
        title={t("meta.featuresTitle")}
        description={t("meta.featuresDescription")}
      />

      <Title order={1} maw={640} style={{ letterSpacing: "-0.02em" }}>
        {t("features.title")}
      </Title>
      <Text size="lg" c="dimmed" mt="md" mb={48} maw={560}>
        {t("features.subtitle")}
      </Text>

      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3 }}
        spacing={1}
        verticalSpacing={1}
        bg="var(--mantine-color-default-border)"
        bd="1px solid var(--mantine-color-default-border)"
        bdrs="var(--mantine-radius-lg)"
        style={{ overflow: "hidden" }}
      >
        {items.map(({ key, icon: Icon }) => (
          <Box
            key={key}
            component="section"
            p="xl"
            bg="var(--mantine-color-body)"
            aria-labelledby={`feature-${key}`}
          >
            <Icon
              size={24}
              stroke={1.5}
              color="var(--mantine-primary-color-filled)"
              aria-hidden
            />
            <Title order={2} id={`feature-${key}`} fz="md" mt="md">
              {t(`features.items.${key}.title`)}
            </Title>
            <Text size="sm" c="dimmed" mt={6} lh={1.6}>
              {t(`features.items.${key}.text`)}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      <Flex
        wrap="wrap"
        align="center"
        justify="space-between"
        gap="lg"
        mt="xl"
        p="xl"
        bdrs="var(--mantine-radius-lg)"
        bg="var(--mantine-color-default-hover)"
      >
        <Box>
          <Text fw={600} size="lg">
            {t("features.cta.title")}
          </Text>
          <Text c="dimmed" size="sm" mt={4}>
            {t("features.cta.text")}
          </Text>
        </Box>
        <Group gap="sm">
          <Button component={Link} to={localize("/register")} variant="default">
            {t("features.cta.secondary")}
          </Button>
          <Button component={Link} to={localize("/")}>
            {t("features.cta.primary")}
          </Button>
        </Group>
      </Flex>
    </Container>
  );
}
