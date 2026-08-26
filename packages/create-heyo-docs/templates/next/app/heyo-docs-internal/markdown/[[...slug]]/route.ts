import {
  markdownForPage,
  pathnameFromMarkdownPath,
} from "@heyo-sh/heyo-docs/node";

import { markdownPages } from "../../../lib/docs";

/** Serves every documentation page as stable, frontmatter-free Markdown. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const pagePathname = pathnameFromMarkdownPath(`/${slug?.join("/") ?? ""}`);
  const page = pagePathname
    ? markdownPages.find((candidate) => candidate.slug === pagePathname)
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
