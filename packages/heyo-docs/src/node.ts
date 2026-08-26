import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { scanContent } from "./content";
import { validateGroupPageReferences } from "./navigation";
import { endpointsFromOpenApiDocuments, isOpenApiDocument } from "./openapi";
import type {
  HeyoDocsConfig,
  OpenApiDocumentSource,
  OpenApiEndpoint,
} from "./types";
import { parse as parseYaml } from "yaml";

export {
  llmTextForPage,
  llmsFull,
  llmsIndex,
  markdownForPage,
  markdownPageForOpenApiEndpoint,
  markdownPathname,
  pathnameFromMarkdownPath,
} from "./llm";

export {
  changelogEntriesFromMdx,
  findMdxFiles,
  pageFromSource,
  searchTextFromMdx,
  scanContent,
} from "./content";

export { rssItems, rssXml } from "./rss";
export { sitemapXml } from "./seo";
export {
  createDocsModel,
  findDocsPage,
  findOpenApiEndpoint,
  normaliseDocsPathname,
} from "./model";
export {
  changelogGroupForPage,
  navigationGroupContainsPath,
  navigationPages,
  navigationSectionPathForPath,
  validateGroupPageReferences,
} from "./navigation";
export {
  endpointsFromOpenApiDocuments,
  openApiEndpointDataFileName,
  openApiEndpointDataPath,
  openApiEndpointDetail,
  openApiEndpointIndex,
} from "./openapi";

/**
 * Loads every schema configured for the documentation model. This is shared by
 * non-Vite adapters so they preserve Vite's local, public and HTTP(S) schema
 * semantics.
 */
export async function loadOpenApiDocuments(
  root: string,
  config: HeyoDocsConfig,
): Promise<OpenApiDocumentSource[]> {
  const sections = config.groups.flatMap((group, groupIndex) => {
    if (group.type === "changelog") return [];
    return group.sections.flatMap((section, sectionIndex) =>
      "schema" in section
        ? [{ groupIndex, sectionIndex, schema: section.schema }]
        : [],
    );
  });

  return Promise.all(
    sections.map(async ({ groupIndex, sectionIndex, schema }) => ({
      groupIndex,
      sectionIndex,
      schema,
      document: await loadOpenApiDocument(root, config.content, schema),
    })),
  );
}

/**
 * Builds the complete, known documentation route list for framework
 * prerenderers. The source files and OpenAPI schemas are build inputs, so this
 * function deliberately runs only during a build rather than on user requests.
 */
export async function documentationPaths(
  root: string,
  config: HeyoDocsConfig,
): Promise<string[]> {
  const contentDirectory = resolve(root, config.content);
  const [pages, documents] = await Promise.all([
    scanContent(contentDirectory),
    loadOpenApiDocuments(root, config),
  ]);
  validateGroupPageReferences(config.groups, pages);
  const endpoints: OpenApiEndpoint[] = endpointsFromOpenApiDocuments(
    config.groups,
    documents,
    pages.map((page) => page.slug),
  );
  return [
    ...new Set([
      ...pages.map((page) => page.slug),
      ...endpoints.map((endpoint) => endpoint.slug),
    ]),
  ].sort((first, second) => first.localeCompare(second));
}

async function loadOpenApiDocument(
  root: string,
  content: string,
  schema: string,
) {
  let source: string;
  if (/^https?:\/\//i.test(schema)) {
    const response = await fetch(schema);
    if (!response.ok)
      throw new Error(
        `Heyo Docs could not load OpenAPI schema \"${schema}\": ${response.status} ${response.statusText}.`,
      );
    source = await response.text();
  } else {
    const candidates = schema.startsWith("/")
      ? [resolve(root, "public", schema.replace(/^\/+/, ""))]
      : [resolve(root, content, schema.replace(/^\.\//, ""))];
    let readError: unknown;
    for (const candidate of candidates) {
      try {
        return parseOpenApiDocument(schema, await readFile(candidate, "utf8"));
      } catch (error) {
        readError = error;
      }
    }
    throw new Error(
      `Heyo Docs could not load OpenAPI schema \"${schema}\". Expected a JSON or YAML file relative to the configured content directory, or a JSON/YAML file in public.`,
      { cause: readError },
    );
  }
  return parseOpenApiDocument(schema, source);
}

function parseOpenApiDocument(schema: string, source: string) {
  let document: unknown;
  try {
    document = /\.ya?ml$/i.test(schema)
      ? parseYaml(source)
      : JSON.parse(source);
  } catch {
    throw new Error(
      `Heyo Docs could not parse OpenAPI schema \"${schema}\". Expected valid JSON or YAML.`,
    );
  }
  if (!isOpenApiDocument(document))
    throw new Error(
      `Heyo Docs OpenAPI schema \"${schema}\" must contain a top-level \"paths\" object.`,
    );
  return document;
}
