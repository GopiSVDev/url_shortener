import { Button, CopyButton } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useI18n } from "~/lib/i18n/i18n";

export function CopyLinkButton({
  value,
  variant = "default",
}: {
  value: string;
  variant?: "filled" | "default";
}) {
  const { t } = useI18n();

  return (
    <CopyButton value={value}>
      {({ copied, copy }) => (
        <Button
          size="xs"
          variant={copied ? "light" : variant}
          color={copied ? "teal" : undefined}
          onClick={copy}
          leftSection={
            copied ? <IconCheck size={14} /> : <IconCopy size={14} />
          }
        >
          {t(copied ? "home.form.copied" : "home.form.copy")}
        </Button>
      )}
    </CopyButton>
  );
}
