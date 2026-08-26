import { llmsFull } from "@heyo-sh/heyo-docs";
import type { LoaderFunctionArgs } from "react-router";

import config from "../../heyo-docs.config";
import { pages } from "virtual:heyo-docs-content/server";

/** The complete documentation corpus, ready for an LLM to consume. */
export function loader({ request }: LoaderFunctionArgs) {
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(llmsFull(pages, siteUrl), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
