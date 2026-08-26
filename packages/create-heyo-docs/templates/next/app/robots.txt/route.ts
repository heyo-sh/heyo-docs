import { config } from "../lib/docs";

export function GET(request: Request) {
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /__heyo-docs/",
      "",
      `Sitemap: ${siteUrl}/sitemap.xml`,
      "",
    ].join("\n"),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
