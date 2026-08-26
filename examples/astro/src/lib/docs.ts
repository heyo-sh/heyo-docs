import {
  changelogGroupForPage,
  createDocsModel,
  findDocsPage,
  findOpenApiEndpoint,
  normaliseDocsPathname,
} from "@heyo-sh/heyo-docs";

import config from "../../heyo-docs.config";
import { openApiDocuments } from "virtual:heyo-docs-openapi";
import { pages } from "virtual:heyo-docs-content";

export function pathnameForSlug(slug: string | undefined): string {
  return normaliseDocsPathname(slug ? `/${slug}` : "/");
}

export function docsContext(pathname: string) {
  const model = createDocsModel(config, pages, openApiDocuments);
  const page = findDocsPage(model.pages, pathname);
  const endpoint = findOpenApiEndpoint(model.endpoints, pathname);

  return {
    config,
    model,
    page,
    endpoint,
    changelogGroup: page
      ? changelogGroupForPage(config.groups, page, model.pages)
      : undefined,
  };
}
