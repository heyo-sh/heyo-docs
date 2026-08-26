import { sitemapXml } from "@heyo-sh/heyo-docs/node";

import { config, docsModel } from "../lib/docs";

export function GET(request: Request) {
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(
    sitemapXml(
      siteUrl,
      [...docsModel.pages, ...docsModel.endpoints].map((page) => page.slug),
    ),
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
}
