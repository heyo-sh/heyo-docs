import type { APIRoute } from "astro";
import { markdownForPage, pathnameFromMarkdownPath } from "@heyo-sh/heyo-docs";

import { pages } from "virtual:heyo-docs-content/server";

export function getStaticPaths() {
  return pages.map((page) => ({
    params: { slug: page.slug === "/" ? "index" : page.slug.slice(1) },
  }));
}

/** Serves every documentation page as stable, frontmatter-free Markdown. */
export const GET: APIRoute = ({ params }) => {
  const pagePathname = pathnameFromMarkdownPath(`/${params.slug ?? ""}.md`);
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
};
