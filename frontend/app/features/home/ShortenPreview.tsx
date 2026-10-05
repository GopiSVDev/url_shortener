import { useState, type FormEvent } from "react";
import {
  Anchor,
  Box,
  Button,
  CopyButton,
  Flex,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconCheck, IconCopy, IconDownload } from "@tabler/icons-react";
import { Link } from "react-router";
import { useI18n } from "~/lib/i18n/i18n";
import { useRootData } from "~/lib/root-data";
import { createQrDataUrl, downloadQrPng } from "./qr";

export function normalizeUrl(input: string) {
  const value = input.trim();
  if (!value) return null;
  try {
    const url = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`,
    );
    const isWeb = url.protocol === "http:" || url.protocol === "https:";
    return isWeb && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

function randomCode(length = 7) {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    crypto.getRandomValues(new Uint8Array(length)),
    (n) => chars[n % chars.length],
  ).join("");
}

type Result = { code: string; shortUrl: string; longUrl: string; qr: string };

/** Demo of the shortening flow. Nothing is sent to the backend yet. */
export function ShortenPreview() {
  const { t, localize } = useI18n();
  const { siteUrl } = useRootData();
  const [error, setError] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const longUrl = normalizeUrl(
      String(new FormData(event.currentTarget).get("url") ?? ""),
    );
    setError(!longUrl);
    if (!longUrl) return setResult(null);

    const code = randomCode();
    const shortUrl = `${siteUrl}/${code}`;
    setResult({ code, shortUrl, longUrl, qr: await createQrDataUrl(shortUrl) });
  }

  return (
    <Paper
      component="section"
      withBorder
      radius="lg"
      p={{ base: "md", sm: "lg" }}
      shadow="xs"
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Group align="flex-start" gap="sm" wrap="wrap">
          <TextInput
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            size="md"
            aria-label={t("home.form.label")}
            placeholder={t("home.form.placeholder")}
            error={error && t("home.form.invalid")}
            onChange={() => setError(false)}
            flex="1 1 280px"
          />
          <Button type="submit" size="md" w={{ base: "100%", xs: "auto" }}>
            {t("home.form.submit")}
          </Button>
        </Group>
      </Box>

      {result && (
        <Box aria-live="polite">
          {/* Details left, QR right; on phones the QR stacks on top. */}
          <Flex
            direction={{ base: "column-reverse", xs: "row" }}
            align={{ base: "stretch", xs: "center" }}
            gap="lg"
            mt="md"
            p="md"
            bg="var(--mantine-color-default-hover)"
            bd="1px solid var(--mantine-color-default-border)"
            bdrs="var(--mantine-radius-md)"
          >
            <Stack gap={4} flex={1} miw={0}>
              <Text size="xs" c="dimmed" fw={500}>
                {t("home.form.result")}
              </Text>
              <Text fw={600} size="xl" truncate>
                {result.shortUrl.replace(/^https?:\/\//, "")}
              </Text>
              <Text size="sm" c="dimmed" truncate title={result.longUrl}>
                {result.longUrl}
              </Text>
              <Group gap="xs" mt="sm">
                <CopyButton value={result.shortUrl}>
                  {({ copied, copy }) => (
                    <Button
                      size="xs"
                      variant={copied ? "light" : "filled"}
                      color={copied ? "teal" : undefined}
                      onClick={copy}
                      leftSection={
                        copied ? (
                          <IconCheck size={14} />
                        ) : (
                          <IconCopy size={14} />
                        )
                      }
                    >
                      {t(copied ? "home.form.copied" : "home.form.copy")}
                    </Button>
                  )}
                </CopyButton>
                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => downloadQrPng(result.qr, `qr-${result.code}`)}
                >
                  {t("home.form.downloadQr")}
                </Button>
              </Group>
            </Stack>

            {/* Always white behind the code so it scans in dark mode too. */}
            <Paper
              bg="white"
              p={6}
              radius="md"
              withBorder
              shadow="sm"
              mx={{ base: "auto", xs: 0 }}
              style={{ flexShrink: 0 }}
            >
              <Image
                src={result.qr}
                alt={t("home.form.qrAlt", { url: result.shortUrl })}
                w={180}
                h={180}
              />
            </Paper>
          </Flex>
          <Text size="sm" c="dimmed" mt="sm" ta="center">
            {t("home.form.preview")}{" "}
            <Anchor component={Link} to={localize("/register")} inherit>
              {t("home.form.previewCta")}
            </Anchor>
          </Text>
        </Box>
      )}
    </Paper>
  );
}
