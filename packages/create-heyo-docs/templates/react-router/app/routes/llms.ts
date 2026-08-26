import { llmsIndex } from "@heyo-sh/heyo-docs";
import type { LoaderFunctionArgs } from "react-router";

import config from "../../heyo-docs.config";
import { pages } from "virtual:heyo-docs-content/server";

/** A concise, discoverable index of every documentation page. */
export function loader({ request }: LoaderFunctionArgs) {
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(llmsIndex(pages, config, siteUrl), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
