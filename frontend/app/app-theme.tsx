import {
  createTheme,
  DEFAULT_THEME,
  MantineProvider,
  Title,
  type CSSVariablesResolver,
  type MantineColorsTuple,
  type MantineProviderProps,
} from "@mantine/core";

/* ----------------------------------------------------------------------------
 * Palette: every color is a 10-shade scale, lightest (0) to darkest (9).
 * Change these to re-brand; everything else derives from them.
 * ------------------------------------------------------------------------- */

const brand: MantineColorsTuple = DEFAULT_THEME.colors.blue;

/**
 * Light-mode neutrals: cool slate, spaced like Mantine's default gray so its
 * mappings still fit: 4 borders, 6 dimmed text, 0–2 subtle backgrounds.
 */
const gray: MantineColorsTuple = [
  "#f8fafc",
  "#f1f5f9",
  "#e9eef4",
  "#e2e8f0",
  "#cbd5e1",
  "#a3afc0",
  "#64748b",
  "#475569",
  "#334155",
  "#1e293b",
];

/**
 * Dark-mode neutrals. Mantine maps them as: 0 text, 2 dimmed text, 4 borders,
 * 5 hover, 6 inputs, 7 page body, 8–9 deeper backgrounds.
 */
const dark: MantineColorsTuple = [
  "#d5d8df",
  "#b4b8c3",
  "#8b909e",
  "#5f6472",
  "#3c404b",
  "#2d3039",
  "#24262e",
  "#1b1d23",
  "#15161b",
  "#0f1014",
];

/* ----------------------------------------------------------------------------
 * Tokens: one name, separate light and dark values, switched
 * automatically by color scheme. Use them in style props, e.g.
 * `bg={surface.muted}`, instead of writing light-dark() CSS.
 * ------------------------------------------------------------------------- */

export const surface = {
  /** Page background behind the sidebar and content card. */
  canvas: "var(--app-surface-canvas)",
  /** Low-emphasis panels inside content (result panel, CTA strip). */
  muted: "var(--app-surface-muted)",
  /** Tracks behind segmented controls and tabs. */
  subtle: "var(--app-surface-subtle)",
  /** Elements lifted above a muted/subtle surface (active tab). */
  raised: "var(--app-surface-raised)",
} as const;

/** Brand color for icons and highlights on plain surfaces, readable in both schemes. */
export const accent = "var(--app-accent)";

const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {},
  light: {
    "--app-surface-canvas": theme.colors.gray[1],
    "--app-surface-muted": theme.colors.gray[0],
    "--app-surface-subtle": theme.colors.gray[1],
    "--app-surface-raised": theme.white,
    "--app-accent": theme.colors.brand[7],
  },
  dark: {
    "--app-surface-canvas": theme.colors.dark[8],
    "--app-surface-muted": theme.colors.dark[6],
    "--app-surface-subtle": theme.colors.dark[6],
    "--app-surface-raised": theme.colors.dark[4],
    "--app-accent": theme.colors.brand[4],
  },
});

/* ----------------------------------------------------------------------------
 * Theme
 * ------------------------------------------------------------------------- */

export const appTheme = createTheme({
  colors: { brand, gray, dark },
  primaryColor: "brand",
  primaryShade: { light: 7, dark: 5 },
  defaultRadius: "md",
  cursorType: "pointer",
  components: {
    Title: Title.extend({ defaultProps: { c: "bright" } }),
  },
  headings: {
    fontWeight: "700",
    sizes: {
      h1: {
        fontSize: "clamp(2.25rem, 1.5rem + 3vw, 3.5rem)",
        lineHeight: "1.1",
      },
      h2: { fontSize: "clamp(1.5rem, 1.25rem + 1vw, 2rem)", lineHeight: "1.2" },
    },
  },
});

export function AppTheme({
  children,
  theme = appTheme,
  ...props
}: MantineProviderProps) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
      {...props}
    >
      {children}
    </MantineProvider>
  );
}
