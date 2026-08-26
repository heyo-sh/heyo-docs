import { rssXml } from "@heyo-sh/heyo-docs";
import type { LoaderFunctionArgs } from "react-router";

import config from "../../heyo-docs.config";
import { pages } from "virtual:heyo-docs-content/server";

/** RSS 2.0 feed for every `<Update>` in the configured changelog groups. */
export function loader({ request }: LoaderFunctionArgs) {
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(rssXml(pages, config, siteUrl), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
