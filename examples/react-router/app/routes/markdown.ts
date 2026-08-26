import { markdownForPage, pathnameFromMarkdownPath } from "@heyo-sh/heyo-docs";
import type { LoaderFunctionArgs } from "react-router";

import { pages } from "virtual:heyo-docs-content/server";

/**
 * Resource route used by the root middleware to serve `*.md` paths. Keeping
 * it route-only makes React Router send the Response body directly.
 */
export function loader({ params }: LoaderFunctionArgs) {
  const pagePathname = pathnameFromMarkdownPath(`/${params["*"] ?? ""}`);
  const page = pagePathname
    ? pages.find((candidate) => candidate.slug === pagePathname)
    : undefined;

  if (!page)
    return new Response("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });

  return new Response(markdownForPage(page), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
