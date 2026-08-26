import {
  copyFile,
  mkdir,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  endpointsFromOpenApiDocuments,
  loadOpenApiDocuments,
  markdownPageForOpenApiEndpoint,
  openApiEndpointDataFileName,
  openApiEndpointDetail,
  openApiEndpointIndex,
  scanContent,
  searchTextFromMdx,
  validateGroupPageReferences,
} from "./node";
import type {
  HeyoDocsConfig,
  MarkdownPage,
  OpenApiDocumentSource,
  OpenApiEndpoint,
  ScannedPage,
} from "./types";

const GENERATED_DIRECTORY = join("app", "_heyo-docs");
const ASSET_DIRECTORY = join("public", "_heyo-docs", "assets");
const OPENAPI_DATA_DIRECTORY = join("public", "_heyo-docs", "openapi");
const require = createRequire(import.meta.url);
const NEXT_MDX_PLUGIN = fileURLToPath(
  new URL("./next-plugins.js", import.meta.url),
);

export interface GenerateNextContentOptions {
  /** Validated configuration exported by the application's heyo-docs.config.ts. */
  config: HeyoDocsConfig;
  /** Application root. Defaults to the current working directory. */
  root?: string;
}

/**
 * Generates statically analyzable MDX and server-data modules for Next's App
 * Router. Next intentionally does not support Vite-style virtual modules, so
 * this adapter writes only derived files under the app-private `_heyo-docs`
 * directory. The user's content remains the source of truth.
 */
export async function generateNextContent({
  config,
  root = process.cwd(),
}: GenerateNextContentOptions): Promise<void> {
  const contentDirectory = resolve(root, config.content);
  const [pages, openApiDocuments] = await Promise.all([
    scanContent(contentDirectory),
    loadOpenApiDocuments(root, config),
  ]);
  validateGroupPageReferences(config.groups, pages);

  const endpoints = endpointsFromOpenApiDocuments(
    config.groups,
    openApiDocuments,
    pages.map((page) => page.slug),
  );
  const markdownPages: MarkdownPage[] = [
    ...pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      description: page.description,
      raw: page.raw,
      sourcePath: page.sourcePath,
    })),
    ...endpoints.map(markdownPageForOpenApiEndpoint),
  ];
  const generatedDirectory = join(root, GENERATED_DIRECTORY);
  await mkdir(generatedDirectory, { recursive: true });
  await Promise.all([
    copyDocumentationAssets(root, contentDirectory, pages),
    writeOpenApiEndpointAssets(root, endpoints),
  ]);
  await Promise.all([
    writeFile(
      join(generatedDirectory, "content.tsx"),
      clientModule(
        contentDirectory,
        generatedDirectory,
        config,
        pages,
        openApiEndpointIndex(endpoints),
      ),
    ),
    writeFile(
      join(generatedDirectory, "server.ts"),
      serverModule(pages, markdownPages, openApiDocuments),
    ),
  ]);
}

function clientModule(
  contentDirectory: string,
  generatedDirectory: string,
  config: HeyoDocsConfig,
  pages: ScannedPage[],
  openApiEndpoints: OpenApiEndpoint[],
): string {
  // Navigation can contain a React element, which is intentionally not JSON
  // serializable. Next's client shell imports the application config to add it
  // back at runtime.
  const { navigation: _navigation, ...serializableConfig } = config;
  const imports = pages
    .map(
      (page, index) =>
        `import Page${index} from ${JSON.stringify(
          moduleSpecifier(
            generatedDirectory,
            resolve(contentDirectory, page.sourcePath),
          ),
        )};`,
    )
    .join("\n");
  const serializedPages = pages
    .map((page, index) =>
      [
        "  {",
        `    slug: ${JSON.stringify(page.slug)},`,
        `    title: ${JSON.stringify(page.title)},`,
        `    description: ${JSON.stringify(page.description)},`,
        `    tableOfContents: ${JSON.stringify(page.tableOfContents)},`,
        `    changelogUpdates: ${JSON.stringify(page.changelogUpdates)},`,
        `    seo: { title: ${JSON.stringify(page.title)}, description: ${JSON.stringify(page.description)} },`,
        `    sourcePath: ${JSON.stringify(page.sourcePath)},`,
        `    searchContent: ${JSON.stringify(searchTextFromMdx(page.raw))},`,
        `    content: Page${index} as unknown as DocsPage["content"],`,
        "  },",
      ].join("\n"),
    )
    .join("\n");

  return `${imports}\n\nimport type { DocsPage, HeyoDocsConfig, OpenApiEndpoint } from "@heyo-sh/heyo-docs";\n\nexport const docsConfig = ${JSON.stringify(serializableConfig)} satisfies HeyoDocsConfig;\n\nexport const pages = [\n${serializedPages}\n] satisfies DocsPage[];\n\n/** Navigation/search index only — detailed endpoint JSON is emitted to public/. */\nexport const openApiEndpoints: OpenApiEndpoint[] = ${JSON.stringify(openApiEndpoints)};\n`;
}

async function writeOpenApiEndpointAssets(
  root: string,
  endpoints: OpenApiEndpoint[],
): Promise<void> {
  const directory = join(root, OPENAPI_DATA_DIRECTORY);
  await rm(directory, { force: true, recursive: true });
  await Promise.all(
    endpoints.map(async (endpoint) => {
      const destination = join(
        root,
        "public",
        openApiEndpointDataFileName(endpoint.slug),
      );
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(
        destination,
        JSON.stringify(openApiEndpointDetail(endpoint)),
      );
    }),
  );
}

function serverModule(
  pages: ScannedPage[],
  markdownPages: MarkdownPage[],
  openApiDocuments: OpenApiDocumentSource[],
): string {
  const docsPages = pages.map((page) => ({
    slug: page.slug,
    title: page.title,
    description: page.description,
    tableOfContents: page.tableOfContents,
    changelogUpdates: page.changelogUpdates,
    sourcePath: page.sourcePath,
    searchContent: searchTextFromMdx(page.raw),
  }));
  return `import type { MarkdownPage, OpenApiDocumentSource } from "@heyo-sh/heyo-docs";\n\nexport const docsPages = ${JSON.stringify(docsPages)};\n\nexport const markdownPages = ${JSON.stringify(markdownPages)} satisfies MarkdownPage[];\n\nexport const openApiDocuments = ${JSON.stringify(openApiDocuments)} satisfies OpenApiDocumentSource[];\n`;
}

function moduleSpecifier(from: string, to: string): string {
  const path = relative(from, to).split(sep).join("/");
  return path.startsWith(".") ? path : `./${path}`;
}

/**
 * MDX compiler options for `@next/mdx`. The asset transformer mirrors the
 * Vite adapter by turning local content URLs into stable public URLs. Keeping
 * the theme and MDX compiler independent lets future themes reuse this shell.
 */
export function heyoDocsMdxOptions(options: {
  root?: string;
  content?: string;
}) {
  const root = options.root ?? process.cwd();
  return {
    // Turbopack receives these values across a Rust boundary. Absolute module
    // paths keep resolution stable in a workspace as well as an installed app.
    rehypePlugins: [require.resolve("rehype-slug")],
    remarkPlugins: [
      require.resolve("remark-frontmatter"),
      require.resolve("remark-gfm"),
      [NEXT_MDX_PLUGIN, { root, contentDirectory: options.content ?? "." }],
    ],
  };
}

export { default as remarkHeyoDocsAssets } from "./next-plugins";

async function copyDocumentationAssets(
  root: string,
  contentDirectory: string,
  pages: ScannedPage[],
): Promise<void> {
  const assetDirectory = join(root, ASSET_DIRECTORY);
  await copyDirectoryAssets(root, contentDirectory, assetDirectory);
  await Promise.all(
    pages.flatMap((page) =>
      assetReferences(page.raw).map((url) =>
        copyReferencedAsset(root, contentDirectory, page.sourcePath, url),
      ),
    ),
  );
}

async function copyDirectoryAssets(
  root: string,
  directory: string,
  assetDirectory: string,
): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const source = join(directory, entry.name);
      if (entry.isDirectory())
        return copyDirectoryAssets(root, source, assetDirectory);
      if (/\.mdx?$/i.test(entry.name)) return;
      const destination = join(assetDirectory, relative(root, source));
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }),
  );
}

function assetReferences(source: string): string[] {
  const values = new Set<string>();
  for (const expression of [
    /\]\(([^\s)]+)(?:\s+[^)]*)?\)/g,
    /\b(?:src|href|poster|lightSrc|darkSrc)\s*=\s*["']([^"']+)["']/g,
  ]) {
    let match: RegExpExecArray | null;
    while ((match = expression.exec(source))) {
      const value = match[1];
      if (value && isRelativeAssetUrl(value)) values.add(value);
    }
  }
  return [...values];
}

async function copyReferencedAsset(
  root: string,
  contentDirectory: string,
  sourcePath: string,
  url: string,
): Promise<void> {
  const { path } = splitUrlSuffix(url);
  if (!path || (!hasFileExtension(url) && !/\b(?:src)=/.test(url))) return;
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    decodedPath = path;
  }
  const source = resolve(contentDirectory, dirname(sourcePath), decodedPath);
  if (!isPathWithin(root, source)) return;
  try {
    if (!(await stat(source)).isFile()) return;
  } catch {
    return;
  }
  const destination = join(root, ASSET_DIRECTORY, relative(root, source));
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

function publicAssetUrl(root: string, source: string): string {
  const encodedPath = relative(root, source)
    .split(sep)
    .map(encodeURIComponent)
    .join("/");
  return `/_heyo-docs/assets/${encodedPath}`;
}

function splitUrlSuffix(url: string) {
  const suffixIndex = url.search(/[?#]/);
  return suffixIndex === -1
    ? { path: url, suffix: "" }
    : { path: url.slice(0, suffixIndex), suffix: url.slice(suffixIndex) };
}

function isRelativeAssetUrl(url: string): boolean {
  const { path } = splitUrlSuffix(url.trim());
  return Boolean(
    path && !path.startsWith("/") && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path),
  );
}

function hasFileExtension(url: string): boolean {
  const { path } = splitUrlSuffix(url);
  const segment = path.split("/").at(-1) ?? "";
  return /\.[a-z0-9]+$/i.test(segment) && !/\.mdx?$/i.test(segment);
}

function isPathWithin(directory: string, candidate: string): boolean {
  const path = relative(directory, candidate);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}
