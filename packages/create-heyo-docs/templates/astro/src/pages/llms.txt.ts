import type { APIRoute } from "astro";
import { llmsIndex } from "@heyo-sh/heyo-docs";

import config from "../../heyo-docs.config";
import { pages } from "virtual:heyo-docs-content/server";

/** A concise, discoverable index of every documentation page. */
export const GET: APIRoute = ({ request }) => {
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(llmsIndex(pages, config, siteUrl), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
