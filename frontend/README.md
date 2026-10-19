# Frontend

Server-rendered React Router 8 app with hand-written CSS (no UI library). It talks to the Spring backend from the server only, so tokens never reach browser JavaScript.

## Development

```bash
pnpm install
pnpm dev          # http://localhost:5173, expects the backend on http://localhost:4000
pnpm typecheck
pnpm build
```

## Environment

| Variable         | Required       | Default                   | Purpose                                                      |
| ---------------- | -------------- | ------------------------- | ------------------------------------------------------------ |
| `API_URL`        | no             | `http://localhost:4000`   | Backend base URL (server-side calls only, so no CORS needed) |
| `SESSION_SECRET` | in production  | dev-only value            | Signs the session cookie                                     |
| `SITE_URL`       | for production | request origin            | Public URL for canonical links, `sitemap.xml`, `robots.txt`  |
| `PORT`           | no             | `3000` (`8000` in Docker) | Port for `pnpm start`                                        |

## Structure

```
app/
  routes.ts              route config (all pages sit under an optional /:lang prefix)
  root.tsx               document shell, auth middleware, locale + user loader
  routes/                thin route modules (loader/action + page component)
  features/auth/         login/sign-up form
  features/links/        shorten form, copy button, QR code renderer, URL and date formatting
  components/layout/     app shell: collapsible sidebar (drawer on mobile) + top bar
  components/            shared UI (Seo, Logo, theme toggle, 404 and error pages, ...)
  .server/               server-only code (never sent to the browser)
    api.ts, env.ts, form.ts, jwt.ts   API client, env vars, form parsing, JWT decoding
    auth/                backend auth calls, session cookie + token refresh, auth form action
    links/               backend link and analytics calls, link form validation
  lib/                   code shared by browser and server: i18n, root data, helpers
  locales/               translations, one JSON file per language
  config/site.ts         brand name and indexed pages
```

### Server-only code

All server-only code lives in `app/.server/`: shared infrastructure at the top, feature code in a subfolder per feature (`.server/auth/`, `.server/links/`). React Router never bundles this folder for the browser, and importing it from client code fails the build. Client components may still use `import type` from it (types are erased), for example the `Link` type from `.server/links/links-api.ts`.

## Styling

- Design tokens (colors, radii, shadows, fonts) are CSS variables at the top of `app/app.css`, with dark values under `:root[data-theme="dark"]`. Use the variables, never raw colors, so both themes work.
- `app.css` also holds the shared primitives: `.btn` (`.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-lg`), `.icon-btn`, `.input`, `.field` + `.field-label`/`.field-hint`/`.field-error`, `.card`, `.alert`, `.badge`, `.page` (centered content column).
- Page and component styles live in a CSS module next to the component (`links.module.css`, `AppLayout.module.css`, ...).
- Five label colors (tomato, marigold, jade, cobalt, plum) color-code items: set `data-color="jade"` on an element and use `var(--c)` (mark), `var(--t)` (tint) and `var(--i)` (text on the tint) inside it. `lib/color.ts` picks a stable color per short code or username.
- Theme: an inline script in `root.tsx` (`lib/theme.ts`) sets `data-theme` before first paint from the saved choice or the system setting, so dark mode never flashes.
- Fonts are self-hosted from npm (`@fontsource-variable/schibsted-grotesk`, `@fontsource-variable/jetbrains-mono` for short codes).
- Dialogs use the native `<dialog>` (`components/Dialog.tsx`): focus trap, Escape and backdrop come from the browser.

## Auth

- Login/sign-up post to route actions, which call the backend and store the access + refresh tokens in an httpOnly, signed `__session` cookie.
- The root middleware (`.server/auth/session.ts`) refreshes the access token through `/api/auth/refresh` when it is within 30s of expiry. If the refresh token is rejected, it clears the session.
- Protect a route with `export const middleware = [requireUser]`; read the user or token with `context.get(authContext)`.

## Layout and pages

- `components/layout/AppLayout.tsx` is the shell: sticky header (nav, theme toggle, account), main, footer. Below 720px the nav moves into a menu button.
- To add a header link, add an entry to `nav` in `AppLayout.tsx`.
- Unknown URLs render `components/NotFoundPage.tsx` with a real 404 status, either from the catch-all route or from the layout's error boundary (for paths like `/xyz`, where `xyz` is rejected as a locale).
- A new top-level page must also be added to the proxy's page list in `deploy/Caddyfile` and to `RESERVED_ALIASES` in the backend, or the proxy treats `/page` as a short code.

## QR codes

`features/links/qr.ts` draws QR codes in a "circuit board" style with a gradient. `uqr` only encodes the data; the SVG is custom. It uses the highest error correction level and keeps the finder patterns solid so codes stay scannable. Check that codes still scan after changing the style.

## Adding a language

Add `app/locales/<code>.json` (for example `de.json`) with any subset of the keys in `en.json`. Missing keys fall back to English. Then add a language switcher to the header (there is none while only English exists) and the locale prefix to the page list in `deploy/Caddyfile`. It's served at `/<code>/...` and gets `hreflang` and sitemap entries. English (the default) has no prefix.

## Brand and domain

- The name lives in `app/config/site.ts`, and the logo in `components/Logo.tsx` and `public/favicon.svg`/`favicon.ico`.
- When you have a domain, set `SITE_URL=https://your-domain.com`. The canonical URLs, Open Graph URLs, sitemap and robots.txt pick it up.
- Add any new public page you want indexed to `indexedPaths` in `config/site.ts`.
