import { rssXml } from "@heyo-sh/heyo-docs/node";

import { config, markdownPages } from "../lib/docs";

export function GET(request: Request) {
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(rssXml(markdownPages, config, siteUrl), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
