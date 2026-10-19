import { useEffect, useState, type ReactNode } from "react";
import { IconLogout, IconMenu2, IconX } from "@tabler/icons-react";
import { Form, Link, NavLink, useLocation } from "react-router";
import { Logo } from "~/components/Logo";
import { ThemeToggle } from "~/components/ThemeToggle";
import { site } from "~/config/site";
import { colorFor } from "~/lib/color";
import { useI18n } from "~/lib/i18n/i18n";
import type { MessageKey } from "~/lib/i18n/locales";
import { useRootData } from "~/lib/root-data";
import styles from "./AppLayout.module.css";

export function AppLayout({ children }: { children: ReactNode }) {
  const { t, localize } = useI18n();
  const { user } = useRootData();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  // Add new pages here.
  const nav: { to: string; label: MessageKey }[] = [
    { to: "/features", label: "nav.features" },
    ...(user ? [{ to: "/links", label: "nav.links" } as const] : []),
  ];

  const navLinks = nav.map(({ to, label }) => (
    <NavLink key={to} to={localize(to)} className={styles.navLink}>
      {t(label)}
    </NavLink>
  ));

  const account = user ? (
    <div className={styles.account}>
      <span
        className={styles.avatar}
        data-color={colorFor(user.username)}
        aria-hidden
      >
        {user.username.charAt(0).toUpperCase()}
      </span>
      <span className={`${styles.username} truncate`}>{user.username}</span>
      <Form method="post" action={localize("/logout")}>
        <button
          type="submit"
          className="icon-btn"
          aria-label={t("nav.logout")}
          title={t("nav.logout")}
        >
          <IconLogout size={18} />
        </button>
      </Form>
    </div>
  ) : (
    <div className={styles.account}>
      <Link to={localize("/login")} className="btn btn-ghost btn-sm">
        {t("nav.login")}
      </Link>
      <Link to={localize("/register")} className="btn btn-primary btn-sm">
        {t("nav.register")}
      </Link>
    </div>
  );

  return (
    <>
      <a href="#main" className={styles.skip}>
        {t("nav.skip")}
      </a>
      <header className={styles.header}>
        <div className={`page ${styles.bar}`}>
          <Logo />
          <nav className={styles.nav} aria-label={t("nav.main")}>
            {navLinks}
          </nav>
          <div className={styles.end}>
            <ThemeToggle />
            <div className={styles.desktopOnly}>{account}</div>
            <button
              type="button"
              className={`icon-btn ${styles.menuButton}`}
              aria-label={t("nav.openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div id="mobile-menu" className={styles.mobileMenu}>
            <nav aria-label={t("nav.main")}>{navLinks}</nav>
            {account}
          </div>
        )}
      </header>

      <main id="main" className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={`page ${styles.footerRow}`}>
          <span>
            {t("footer.copyright", {
              year: new Date().getFullYear(),
              name: site.name,
            })}
          </span>
          <span className={styles.swatches} aria-hidden>
            {(["tomato", "marigold", "jade", "cobalt", "plum"] as const).map(
              (color) => (
                <i key={color} data-color={color} />
              ),
            )}
          </span>
        </div>
      </footer>
    </>
  );
}
