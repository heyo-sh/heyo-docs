import type { DocsPage } from "@heyo-sh/heyo-docs";
import {
  changelogGroupForPage,
  createDocsModel,
  findDocsPage,
  findOpenApiEndpoint,
  normaliseDocsPathname,
} from "@heyo-sh/heyo-docs/node";

import config from "../../heyo-docs.config";
import {
  docsPages,
  markdownPages,
  openApiDocuments,
} from "../_heyo-docs/server";

/** Server-only model: MDX components stay on the client-side module boundary. */
export const docsModel = createDocsModel(
  config,
  docsPages as unknown as DocsPage[],
  openApiDocuments,
);

export { config, markdownPages };

export function pathnameForSegments(slug: string[] | undefined): string {
  return normaliseDocsPathname(slug?.join("/") ?? "/");
}

export function docsContext(pathname: string) {
  const page = findDocsPage(docsModel.pages, pathname);
  const endpoint = findOpenApiEndpoint(docsModel.endpoints, pathname);
  return {
    config,
    model: docsModel,
    navigation: docsModel.navigation,
    page,
    endpoint,
    changelogGroup: page
      ? changelogGroupForPage(config.groups, page, docsModel.pages)
      : undefined,
  };
}
