export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/**
 * Inline script for <head>: applies the saved theme, or the system one when none was picked,
 * and follows system changes until the user picks one.
 */
export const themeScript = `(() => {
  const root = document.documentElement;
  const media = matchMedia("(prefers-color-scheme: dark)");
  const saved = () => { try { return localStorage.getItem("${STORAGE_KEY}"); } catch { return null; } };
  const apply = () => { root.dataset.theme = saved() || (media.matches ? "dark" : "light"); };
  apply();
  media.addEventListener("change", apply);
})();`;

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // private mode: the choice lasts for this page only
  }
}
