import { llmsFull } from "@heyo-sh/heyo-docs/node";

import { config, markdownPages } from "../lib/docs";

export function GET(request: Request) {
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(llmsFull(markdownPages, siteUrl), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
