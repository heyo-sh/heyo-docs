import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

interface MdxNode {
  attributes?: MdxAttribute[];
  children?: MdxNode[];
  data?: { hProperties?: Record<string, unknown> };
  meta?: string;
  name?: string;
  type?: string;
  url?: string;
}

interface MdxAttribute {
  name?: string;
  type?: string;
  value?: string | unknown;
}

interface MdxFile {
  path?: string;
}

/**
 * Turbopack loads this plugin by package name. It removes frontmatter after
 * metadata generation and rewrites local MDX assets to the managed public URL.
 */
export default function remarkHeyoDocsAssets(options: {
  root: string;
  contentDirectory: string;
}) {
  const root = resolve(options.root);
  const contentDirectory = resolve(root, options.contentDirectory);

  return (tree: MdxNode, file: MdxFile) => {
    tree.children = tree.children?.filter((node) => node.type !== "yaml");
    const sourcePath = file.path ? resolve(file.path) : undefined;
    if (!sourcePath || !isPathWithin(contentDirectory, sourcePath)) return;

    const assetUrl = (url: string, kind: "file" | "media") => {
      if (
        (kind === "file" && !hasFileExtension(url)) ||
        !isRelativeAssetUrl(url)
      )
        return url;
      const { path, suffix } = splitUrlSuffix(url);
      let decodedPath: string;
      try {
        decodedPath = decodeURIComponent(path);
      } catch {
        decodedPath = path;
      }
      const assetPath = resolve(dirname(sourcePath), decodedPath);
      if (!isPathWithin(root, assetPath))
        throw new Error(
          `Heyo Docs local asset \"${url}\" in ${relative(contentDirectory, sourcePath)} must stay within the project root.`,
        );
      return `${publicAssetUrl(root, assetPath)}${suffix}`;
    };

    const visit = (node: MdxNode) => {
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
        node.url = assetUrl(node.url, "media");
      if (node.type === "link" && typeof node.url === "string")
        node.url = assetUrl(node.url, "file");
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
          const value = attribute.value;
          if (
            attribute.name === "src" ||
            attribute.name === "poster" ||
            attribute.name === "lightSrc" ||
            attribute.name === "darkSrc"
          )
            attribute.value = assetUrl(value, "media");
          if (
            attribute.name === "href" &&
            (name === "a" || name === "file" || name === "button")
          )
            attribute.value = assetUrl(value, "file");
        }
      }
      node.children?.forEach(visit);
    };

    visit(tree);
  };
}

function codeBlockTitle(meta?: string) {
  const match = meta?.match(/(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|([^\s]+))/);
  return match?.[1] ?? match?.[2] ?? match?.[3];
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
