import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("robots.txt", "routes/robots.ts"),
  route("sitemap.xml", "routes/sitemap.ts"),
  route("rss.xml", "routes/rss.ts"),
  route("llms.txt", "routes/llms.ts"),
  route("llms-full.txt", "routes/llms-full.ts"),
  route("__heyo-docs/markdown/*", "routes/markdown.ts"),
  route("heyo-docs-internal/openapi-request", "routes/openapi-request.ts"),
  route("*", "routes/page.tsx"),
] satisfies RouteConfig;
