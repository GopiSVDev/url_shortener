import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  route("robots.txt", "routes/robots.ts"),
  route("sitemap.xml", "routes/sitemap.ts"),

  ...prefix(":lang?", [
    layout("routes/layout.tsx", [
      index("routes/home.tsx"),
      route("features", "routes/features.tsx"),
      route("login", "routes/login.tsx"),
      route("register", "routes/register.tsx"),
      route("welcome", "routes/welcome.tsx"),
      route("logout", "routes/logout.ts"),
      route("*", "routes/not-found.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
