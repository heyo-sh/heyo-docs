import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import { compile } from "@mdx-js/mdx";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { parse as parseYaml } from "yaml";

import { parseFrontmatter, scanContent, searchTextFromMdx } from "./content";
import { markdownPageForOpenApiEndpoint } from "./llm";
import { validateGroupPageReferences } from "./navigation";
import {
  endpointsFromOpenApiDocuments,
  isOpenApiDocument,
  openApiEndpointDataFileName,
  openApiEndpointDataPath,
  openApiEndpointDetail,
  openApiEndpointIndex,
} from "./openapi";
import { seoForPage } from "./seo";
import type {
  HeyoDocsConfig,
  MarkdownPage,
  OpenApiDocumentSource,
  OpenApiEndpoint,
  ScannedPage,
} from "./types";

const CONTENT_MODULE = "virtual:heyo-docs-content";
const CONTENT_SERVER_MODULE = "virtual:heyo-docs-content/server";
const OPENAPI_MODULE = "virtual:heyo-docs-openapi";
const OPENAPI_INDEX_MODULE = "virtual:heyo-docs-openapi/index";
const MDX_MODULE_PREFIX = "virtual:heyo-docs-mdx:";
const RESOLVED_PREFIX = "\0";

/**
 * A deliberately structural subset of Vite's plugin API. Keeping this contract
 * local avoids leaking a Vite 7 or 8-specific branded type into consumers.
 */
export interface HeyoDocsVitePlugin {
  name: string;
  enforce: "pre";
  configResolved(config: { command?: "build" | "serve"; root: string }): void;
  configureServer?(server: {
    watcher: { add(paths: string[]): void };
    ws: { send(payload: { type: "full-reload" }): void };
    middlewares: {
      use(
        handler: (
          request: { url?: string },
          response: {
            end(body?: string): void;
            setHeader(name: string, value: string): void;
            statusCode: number;
          },
          next: (error?: unknown) => void,
        ) => void,
      ): void;
    };
  }): void;
  resolveId(id: string): string | undefined;
  load(
    this: unknown,
    id: string,
    options?: { ssr?: boolean },
  ): Promise<string | undefined>;
  handleHotUpdate?(context: {
    file: string;
    server: {
      moduleGraph: {
        // Vite's ModuleNode is intentionally opaque here: exposing its
        // branded type would force every Heyo Docs consumer to share Vite's
        // exact version.
        getModuleById(id: string): any;
      };
    };
  }): any[] | undefined;
  generateBundle?(this: {
    emitFile(file: { type: "asset"; fileName: string; source: string }): void;
    environment?: { config?: { consumer?: "client" | "server" } };
  }): Promise<void>;
}

/**
 * The small part of Vite's per-environment plugin context we need. Vite 6+
 * exposes this in all module hooks; the optional legacy argument keeps the
 * plugin compatible with Vite 5 consumers.
 */
interface HeyoDocsVitePluginContext {
  environment?: { config?: { consumer?: "client" | "server" } };
}

export interface HeyoDocsViteOptions {
  config: HeyoDocsConfig;
}

/**
 * Turns the user's MDX directory into Vite virtual modules. It keeps content out
 * of template source files and makes an MDX/config change trigger a browser reload.
 */
export function heyoDocs(options: HeyoDocsViteOptions): HeyoDocsVitePlugin {
  let root = process.cwd();
  let contentDirectory = resolve(root, options.config.content);
  let isBuild = false;
  let schemaPaths = openApiSchemaPaths(root, options.config);
  const loadedVirtualModuleIds = new Set<string>();
  const pages = async (): Promise<ScannedPage[]> => {
    const scannedPages = await scanContent(contentDirectory);
    try {
      validateGroupPageReferences(options.config.groups, scannedPages);
    } catch (error) {
      if (isBuild) throw error;
      console.warn(
        `Heyo Docs configuration warning: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return scannedPages;
  };
  const openApiDocuments = () => loadOpenApiDocuments(root, options.config);

  return {
    name: "heyo-docs:content",
    enforce: "pre",
    configResolved(config) {
      root = config.root;
      contentDirectory = resolve(root, options.config.content);
      isBuild = config.command === "build";
      schemaPaths = openApiSchemaPaths(root, options.config);
    },
    configureServer(server) {
      server.watcher.add([
        contentDirectory,
        resolve(root, "heyo-docs.config.ts"),
        ...schemaPaths,
      ]);
      // Production builds emit these JSON files as ordinary static assets. The
      // development server creates the same response in memory, so navigating
      // an endpoint during `vite dev` has identical client-side behaviour.
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split("?", 1)[0];
        if (
          !pathname?.startsWith("/_heyo-docs/openapi/") ||
          !pathname.endsWith(".json")
        ) {
          next();
          return;
        }

        void Promise.all([pages(), openApiDocuments()])
          .then(([scannedPages, documents]) => {
            const endpoint = endpointsFromOpenApiDocuments(
              options.config.groups,
              documents,
              scannedPages.map((page) => page.slug),
            ).find(
              (candidate) =>
                openApiEndpointDataPath(candidate.slug) === pathname,
            );
            if (!endpoint) {
              response.statusCode = 404;
              response.end("Not found");
              return;
            }
            response.setHeader(
              "Content-Type",
              "application/json; charset=utf-8",
            );
            response.setHeader("Cache-Control", "no-store");
            response.end(JSON.stringify(openApiEndpointDetail(endpoint)));
          })
          .catch(next);
      });
    },
    resolveId(id) {
      if (
        id === CONTENT_MODULE ||
        id === CONTENT_SERVER_MODULE ||
        id === OPENAPI_MODULE ||
        id === OPENAPI_INDEX_MODULE ||
        id.startsWith(MDX_MODULE_PREFIX)
      )
        return `${RESOLVED_PREFIX}${id}`;
      return undefined;
    },
    async load(this: unknown, id, loadOptions) {
      const virtualId = id.startsWith(RESOLVED_PREFIX) ? id.slice(1) : id;
      if (isHeyoDocsVirtualModule(virtualId)) loadedVirtualModuleIds.add(id);
      if (virtualId === CONTENT_MODULE)
        return createContentModule(await pages(), options.config);
      if (virtualId === CONTENT_SERVER_MODULE) {
        const [scannedPages, documents] = await Promise.all([
          pages(),
          openApiDocuments(),
        ]);
        const endpoints = endpointsFromOpenApiDocuments(
          options.config.groups,
          documents,
          scannedPages.map((page) => page.slug),
        );
        return createServerContentModule([
          ...scannedPages.map(markdownPageFromScannedPage),
          ...endpoints.map(markdownPageForOpenApiEndpoint),
        ]);
      }
      if (virtualId === OPENAPI_MODULE) {
        // Resource routes and SSR need the complete specification. Supplying
        // an empty module in a browser environment is intentional: Vite then
        // cannot pull multi-megabyte OpenAPI JSON into the shared client chunk
        // merely because a server-only route imports this virtual module.
        const environment = (this as HeyoDocsVitePluginContext).environment;
        const isClient =
          environment?.config?.consumer === "client" ||
          loadOptions?.ssr === false;
        if (isClient) return createOpenApiModule([]);
        return createOpenApiModule(await openApiDocuments());
      }
      if (virtualId === OPENAPI_INDEX_MODULE) {
        const [scannedPages, documents] = await Promise.all([
          pages(),
          openApiDocuments(),
        ]);
        return createOpenApiIndexModule(
          openApiEndpointIndex(
            endpointsFromOpenApiDocuments(
              options.config.groups,
              documents,
              scannedPages.map((page) => page.slug),
            ),
          ),
        );
      }
      if (virtualId.startsWith(MDX_MODULE_PREFIX)) {
        const sourcePath = decodeURIComponent(
          virtualId.slice(MDX_MODULE_PREFIX.length),
        );
        const page = (await pages()).find(
          (candidate) => candidate.sourcePath === sourcePath,
        );
        if (!page)
          throw new Error(`Heyo Docs could not find MDX source: ${sourcePath}`);
        return compileMdx(parseFrontmatter(page.raw).body, {
          contentDirectory,
          root,
          sourcePath: page.sourcePath,
        });
      }
      return undefined;
    },
    handleHotUpdate(context) {
      if (
        context.file.startsWith(contentDirectory) ||
        context.file === resolve(root, "heyo-docs.config.ts") ||
        schemaPaths.includes(context.file)
      ) {
        // MDX lives behind virtual modules, so Vite cannot associate an
        // authored content file with the modules it must invalidate. Returning
        // those modules lets Vite evict both the browser and SSR caches before
        // propagating the update (or choosing a full reload itself).
        return [...loadedVirtualModuleIds].flatMap((id) => {
          const module = context.server.moduleGraph.getModuleById(id);
          return module === undefined ? [] : [module];
        });
      }
      return undefined;
    },
    async generateBundle(this: {
      emitFile(file: { type: "asset"; fileName: string; source: string }): void;
      environment?: { config?: { consumer?: "client" | "server" } };
    }) {
      // Frameworks that use Vite build separate server and browser bundles.
      // Static endpoint JSON belongs only in the browser/public output.
      if (this.environment?.config?.consumer === "server") return;
      const [scannedPages, documents] = await Promise.all([
        pages(),
        openApiDocuments(),
      ]);
      const endpoints = endpointsFromOpenApiDocuments(
        options.config.groups,
        documents,
        scannedPages.map((page) => page.slug),
      );
      for (const endpoint of endpoints) {
        this.emitFile({
          type: "asset",
          fileName: openApiEndpointDataFileName(endpoint.slug),
          source: JSON.stringify(openApiEndpointDetail(endpoint)),
        });
      }
    },
  };
}

function isHeyoDocsVirtualModule(id: string) {
  return (
    id === CONTENT_MODULE ||
    id === CONTENT_SERVER_MODULE ||
    id === OPENAPI_MODULE ||
    id === OPENAPI_INDEX_MODULE ||
    id.startsWith(MDX_MODULE_PREFIX)
  );
}

function createOpenApiModule(documents: OpenApiDocumentSource[]): string {
  return `export const openApiDocuments = ${JSON.stringify(documents)};\n`;
}

function createOpenApiIndexModule(endpoints: OpenApiEndpoint[]): string {
  return `export const openApiEndpoints = ${JSON.stringify(endpoints)};\n`;
}

function openApiSchemaPaths(root: string, config: HeyoDocsConfig): string[] {
  return config.groups.flatMap((group) => {
    if (group.type === "changelog") return [];
    return group.sections.flatMap((section) => {
      if (!("schema" in section) || /^https?:\/\//i.test(section.schema))
        return [];
      return openApiSchemaCandidates(root, config.content, section.schema);
    });
  });
}

function openApiSchemaCandidates(
  root: string,
  content: string,
  schema: string,
): string[] {
  const normalised = schema.replace(/^\.\//, "");
  if (normalised.startsWith("/")) {
    const relativeSchema = normalised.replace(/^\/+/, "");
    return [resolve(root, "public", relativeSchema)];
  }
  return [resolve(root, content, normalised)];
}

async function loadOpenApiDocuments(
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
    const candidates = openApiSchemaCandidates(root, content, schema);
    let readError: unknown;
    for (const candidate of candidates) {
      try {
        source = await readFile(candidate, "utf8");
        return parseOpenApiDocument(schema, source);
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
    document = isYamlSchema(schema) ? parseYaml(source) : JSON.parse(source);
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

function isYamlSchema(schema: string): boolean {
  return /\.ya?ml$/i.test(schema);
}

function createServerContentModule(pages: MarkdownPage[]): string {
  const pageData = pages.map((page) => serializeMarkdownPage(page)).join(",\n");
  return `export const pages = [\n${pageData}\n];\n`;
}

function createContentModule(
  pages: ScannedPage[],
  config: HeyoDocsConfig,
): string {
  const imports = pages
    .map(
      (page, index) =>
        `import Page${index} from ${JSON.stringify(`${MDX_MODULE_PREFIX}${encodeURIComponent(page.sourcePath)}`)};`,
    )
    .join("\n");
  const pageData = pages
    .map((page, index) => serializePage(page, index, config))
    .join(",\n");
  return `${imports}\n\nexport const pages = [\n${pageData}\n];\n`;
}

function serializePage(
  page: ScannedPage,
  index: number,
  config: HeyoDocsConfig,
): string {
  return [
    "  {",
    `    slug: ${JSON.stringify(page.slug)},`,
    `    title: ${JSON.stringify(page.title)},`,
    `    description: ${JSON.stringify(page.description)},`,
    `    tableOfContents: ${JSON.stringify(page.tableOfContents)},`,
    `    changelogUpdates: ${JSON.stringify(page.changelogUpdates)},`,
    `    seo: ${JSON.stringify(seoForPage(config, page))},`,
    `    sourcePath: ${JSON.stringify(page.sourcePath)},`,
    `    searchContent: ${JSON.stringify(searchTextFromMdx(page.raw))},`,
    `    content: Page${index},`,
    "  }",
  ].join("\n");
}

function markdownPageFromScannedPage(page: ScannedPage): MarkdownPage {
  return {
    slug: page.slug,
    title: page.title,
    description: page.description,
    raw: page.raw,
    sourcePath: page.sourcePath,
  };
}

function serializeMarkdownPage(page: MarkdownPage): string {
  return `  ${JSON.stringify(page)}`;
}

interface LocalAsset {
  id: string;
  importPath: string;
  suffix: string;
  token: string;
}

interface LocalAssetPluginOptions {
  assets: LocalAsset[];
  contentDirectory: string;
  root: string;
  sourcePath: string;
}

type MdxNode = {
  attributes?: MdxAttribute[];
  children?: MdxNode[];
  data?: { hProperties?: Record<string, unknown> };
  meta?: string;
  name?: string;
  type?: string;
  url?: string;
};

type MdxAttribute = {
  name?: string;
  type?: string;
  value?: string | unknown;
};

/**
 * Replaces local MDX asset URLs with tokens that are turned into Vite imports
 * after compilation. This keeps relative images and downloads in the build
 * output instead of leaving the browser to resolve them against a docs route.
 */
function remarkLocalAssets(options: LocalAssetPluginOptions) {
  const assetsByUrl = new Map<string, LocalAsset>();

  function assetFor(url: string): LocalAsset | undefined {
    if (!isRelativeAssetUrl(url)) return undefined;

    const existing = assetsByUrl.get(url);
    if (existing) return existing;

    const { path, suffix } = splitUrlSuffix(url);
    if (!path) return undefined;

    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(path);
    } catch {
      decodedPath = path;
    }

    const importPath = resolve(
      options.contentDirectory,
      dirname(options.sourcePath),
      decodedPath,
    );
    if (!isPathWithin(options.root, importPath)) {
      throw new Error(
        `Heyo Docs local asset "${url}" in ${options.sourcePath} must stay within the project root.`,
      );
    }

    const asset: LocalAsset = {
      id: `__heyoDocsAsset${options.assets.length}`,
      importPath,
      suffix,
      token: `__HEYO_DOCS_ASSET_${options.assets.length}__`,
    };
    assetsByUrl.set(url, asset);
    options.assets.push(asset);
    return asset;
  }

  function replaceUrl(url: string, kind: "file" | "media") {
    if (kind === "file" && !hasFileExtension(url)) return url;
    const asset = assetFor(url);
    return asset ? `${asset.token}${asset.suffix}` : url;
  }

  function visit(node: MdxNode) {
    if (node.type === "code") {
      const title = codeBlockTitle(node.meta);
      if (title !== undefined) {
        node.data = {
          ...node.data,
          hProperties: { ...node.data?.hProperties, title },
        };
      }
    }
    if (node.type === "image" && typeof node.url === "string")
      node.url = replaceUrl(node.url, "media");
    if (node.type === "link" && typeof node.url === "string")
      node.url = replaceUrl(node.url, "file");

    if (
      (node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement") &&
      node.attributes
    ) {
      const name = node.name?.toLowerCase();
      for (const attribute of node.attributes) {
        if (
          attribute.type !== "mdxJsxAttribute" ||
          typeof attribute.value !== "string"
        )
          continue;
        const url = attribute.value;
        if (
          attribute.name === "src" ||
          attribute.name === "poster" ||
          attribute.name === "lightSrc" ||
          attribute.name === "darkSrc"
        )
          attribute.value = replaceUrl(url, "media");
        if (
          attribute.name === "href" &&
          (name === "a" || name === "file" || name === "button")
        )
          attribute.value = replaceUrl(url, "file");
      }
    }

    node.children?.forEach(visit);
  }

  return (tree: MdxNode) => visit(tree);
}

function codeBlockTitle(meta?: string) {
  const match = meta?.match(/(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|([^\s]+))/);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function splitUrlSuffix(url: string) {
  const suffixIndex = url.search(/[?#]/);
  return suffixIndex === -1
    ? { path: url, suffix: "" }
    : { path: url.slice(0, suffixIndex), suffix: url.slice(suffixIndex) };
}

function isRelativeAssetUrl(url: string) {
  const { path } = splitUrlSuffix(url.trim());
  return Boolean(
    path && !path.startsWith("/") && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path),
  );
}

function hasFileExtension(url: string) {
  const { path } = splitUrlSuffix(url);
  const segment = path.split("/").at(-1) ?? "";
  return /\.[a-z0-9]+$/i.test(segment) && !/\.mdx?$/i.test(segment);
}

function isPathWithin(directory: string, candidate: string) {
  const path = relative(directory, candidate);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}

async function compileMdx(
  source: string,
  options: Omit<LocalAssetPluginOptions, "assets">,
): Promise<string> {
  const assets: LocalAsset[] = [];
  const compiled = await compile(source, {
    outputFormat: "program",
    providerImportSource: undefined,
    rehypePlugins: [rehypeSlug],
    remarkPlugins: [remarkGfm, [remarkLocalAssets, { ...options, assets }]],
  });
  let output = resolveMdxRelativeImports(String(compiled), options);
  for (const asset of assets) {
    output = output.replaceAll(
      JSON.stringify(`${asset.token}${asset.suffix}`),
      asset.suffix
        ? `(${asset.id} + ${JSON.stringify(asset.suffix)})`
        : asset.id,
    );
  }
  const imports = assets
    .map(
      (asset) =>
        `import ${asset.id} from ${JSON.stringify(`${asset.importPath}?url`)};`,
    )
    .join("\n");
  return imports ? `${imports}\n${output}` : output;
}

/**
 * MDX pages are exposed through virtual Vite modules, so their authored
 * relative imports would otherwise resolve from the virtual module ID. Turn
 * them into project paths before Vite processes the compiled page.
 */
function resolveMdxRelativeImports(
  source: string,
  options: Omit<LocalAssetPluginOptions, "assets">,
) {
  return source.replaceAll(
    /(\bfrom\s+)(["'])(\.{1,2}\/[^"']+)\2/g,
    (match, prefix: string, quote: string, importUrl: string) => {
      const { path, suffix } = splitUrlSuffix(importUrl);
      const importPath = resolve(
        options.contentDirectory,
        dirname(options.sourcePath),
        path,
      );
      if (!isPathWithin(options.root, importPath)) return match;
      return `${prefix}${quote}${importPath}${suffix}${quote}`;
    },
  );
}
