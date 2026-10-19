import type { ReactNode } from "react";

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
    <section
      className="page"
      style={{ paddingBlock: "clamp(56px, 12vh, 120px)", maxWidth: 720 }}
    >
      <p
        className="mono"
        style={{
          fontSize: "clamp(64px, 14vw, 120px)",
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.06em",
          color: "var(--accent)",
        }}
      >
        {status}
      </p>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", marginTop: 16 }}>
        {title}
      </h1>
      <p className="muted" style={{ fontSize: 18, marginTop: 8 }}>
        {description}
      </p>
      {detail && <div style={{ marginTop: 16 }}>{detail}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 32 }}>
        {actions}
      </div>
    </section>
  );
}
