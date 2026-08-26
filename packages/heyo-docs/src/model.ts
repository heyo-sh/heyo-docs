import { changelogGroupForPage, navigationFromGroups } from "./navigation";
import { endpointsFromOpenApiDocuments } from "./openapi";
import { seoForPage } from "./seo";
import type {
  DocsModel,
  DocsPage,
  HeyoDocsConfig,
  OpenApiDocumentSource,
  OpenApiEndpoint,
} from "./types";

/** Builds the framework-neutral documentation model used by every shell. */
export function createDocsModel(
  config: HeyoDocsConfig,
  pages: DocsPage[],
  openApiDocuments: OpenApiDocumentSource[] = [],
  openApiEndpoints?: OpenApiEndpoint[],
): DocsModel {
  const enrichedPages = pages.map((page) => ({
    ...page,
    seo: seoForPage(config, page),
  }));
  const endpoints =
    openApiEndpoints ??
    endpointsFromOpenApiDocuments(
      config.groups,
      openApiDocuments,
      enrichedPages.map((page) => page.slug),
    );
  return {
    pages: enrichedPages,
    endpoints,
    navigation: navigationFromGroups(config.groups, enrichedPages, endpoints),
  };
}

export function findDocsPage(
  pages: DocsPage[],
  pathname: string,
): DocsPage | undefined {
  const normalised = normaliseDocsPathname(pathname);
  return pages.find((page) => page.slug === normalised);
}

export function findOpenApiEndpoint(
  endpoints: OpenApiEndpoint[],
  pathname: string,
): OpenApiEndpoint | undefined {
  const normalised = normaliseDocsPathname(pathname);
  return endpoints.find((endpoint) => endpoint.slug === normalised);
}

/** Normalises route parameters from framework catch-all routes. */
export function normaliseDocsPathname(pathname: string): string {
  const segments = pathname.replace(/^\/+|\/+$/g, "");
  return segments ? `/${segments}` : "/";
}

export { changelogGroupForPage };
