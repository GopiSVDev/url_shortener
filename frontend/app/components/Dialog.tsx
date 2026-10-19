import { useEffect, useRef, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";
import { useI18n } from "~/lib/i18n/i18n";
import styles from "./Dialog.module.css";

/**
 * Modal on the native <dialog>: focus trap, Escape and the top layer come from the browser.
 * Children only render while open, so each opening starts with a fresh form.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      style={{ width: `min(${width}px, calc(100vw - 24px))` }}
      aria-labelledby="dialog-title"
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {open && (
        <div className={styles.body}>
          <header className={styles.header}>
            <h2 id="dialog-title">{title}</h2>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <IconX size={18} />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
