import { createDocsModel, sitemapXml } from "@heyo-sh/heyo-docs";
import type { Route } from "./+types/sitemap";

import config from "../../heyo-docs.config";
import { sitemapPaths } from "../lib/seo";
import { pages } from "virtual:heyo-docs-content";
import { openApiDocuments } from "virtual:heyo-docs-openapi";

export function loader({ request }: Route.LoaderArgs) {
  const model = createDocsModel(config, pages, openApiDocuments);
  return new Response(
    sitemapXml(
      config.siteUrl ?? new URL(request.url).origin,
      sitemapPaths(model),
    ),
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
}
