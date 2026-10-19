import { colorFor } from "~/lib/color";
import { displayUrl } from "./format";

/** "sho.rt/abc123" in mono, with the code part in the link's label color. */
export function ShortUrl({ url }: { url: string }) {
  const text = displayUrl(url);
  const slash = text.lastIndexOf("/");
  const code = text.slice(slash + 1);

  return (
    <span className="mono" style={{ whiteSpace: "nowrap" }}>
      <span style={{ color: "var(--ink-3)" }}>{text.slice(0, slash + 1)}</span>
      <span data-color={colorFor(code)} style={{ color: "var(--c)" }}>
        {code}
      </span>
    </span>
  );
}
