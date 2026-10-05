import type { ReactNode } from "react";
import { Container, Group, Stack, Text, Title } from "@mantine/core";

type ErrorStateProps = {
  status: number;
  title: string;
  description: string;
  /** Extra detail under the description, e.g. the missing path. */
  detail?: ReactNode;
  actions: ReactNode;
};

export function ErrorState({
  status,
  title,
  description,
  detail,
  actions,
}: ErrorStateProps) {
  return (
    <Container
      size="sm"
      py={{ base: 48, sm: 72 }}
      display="flex"
      mih="calc(100dvh - 160px)"
      style={{ flexDirection: "column", justifyContent: "center" }}
    >
      <Stack align="center" ta="center" gap="md">
        <Text
          c="brand"
          fw={700}
          size="sm"
          tt="uppercase"
          style={{ letterSpacing: "0.08em" }}
        >
          {status}
        </Text>
        <Title order={1} style={{ letterSpacing: "-0.02em" }}>
          {title}
        </Title>
        <Text c="dimmed" size="lg" maw={440}>
          {description}
        </Text>
        {detail}
        <Group justify="center" gap="sm" mt="md">
          {actions}
        </Group>
      </Stack>
    </Container>
  );
}
