import type { APIRoute } from "astro";
import { sitemapXml } from "@heyo-sh/heyo-docs";

import config from "../../heyo-docs.config";
import { createDocsModel } from "@heyo-sh/heyo-docs";
import { openApiDocuments } from "virtual:heyo-docs-openapi";
import { pages } from "virtual:heyo-docs-content";

export const GET: APIRoute = ({ request }) => {
  const model = createDocsModel(config, pages, openApiDocuments);
  const siteUrl = config.siteUrl ?? new URL(request.url).origin;
  return new Response(
    sitemapXml(
      siteUrl,
      [...model.pages, ...model.endpoints].map((page) => page.slug),
    ),
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
};
