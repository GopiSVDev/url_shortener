import { useEffect, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useI18n } from "~/lib/i18n/i18n";

function useCopy(value: string) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = () =>
    navigator.clipboard.writeText(value).then(() => setCopied(true));
  return { copied, copy };
}

/** Text button: "Copy" / "Copied". */
export function CopyLinkButton({
  value,
  primary,
  size = "sm",
}: {
  value: string;
  primary?: boolean;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const { copied, copy } = useCopy(value);
  const Icon = copied ? IconCheck : IconCopy;

  return (
    <button
      type="button"
      className={`btn ${size === "sm" ? "btn-sm" : ""} ${primary ? "btn-primary" : ""}`}
      onClick={copy}
      aria-live="polite"
    >
      <Icon size={size === "sm" ? 15 : 17} stroke={2} />
      {t(copied ? "common.copied" : "common.copy")}
    </button>
  );
}

/** Icon-only variant for dense rows. */
export function CopyIconButton({ value }: { value: string }) {
  const { t } = useI18n();
  const { copied, copy } = useCopy(value);
  const label = t(copied ? "common.copied" : "common.copy");

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={copy}
      aria-label={label}
      title={label}
      style={copied ? { color: "var(--success)" } : undefined}
    >
      {copied ? <IconCheck size={17} /> : <IconCopy size={17} />}
    </button>
  );
}
