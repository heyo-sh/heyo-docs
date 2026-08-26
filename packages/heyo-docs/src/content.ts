import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

import type {
  ChangelogEntry,
  ChangelogUpdate,
  ScannedPage,
  TableOfContentsItem,
} from "./types";

const MDX_EXTENSIONS = new Set([".md", ".mdx"]);

export function slugFromFilePath(filePath: string): string {
  const normalised = filePath.replaceAll("\\", "/").replace(/^\.\//, "");
  const withoutExtension = normalised.replace(/\.(?:md|mdx)$/i, "");
  const segments = withoutExtension.split("/").filter(Boolean);
  if (segments.at(-1)?.toLowerCase() === "index") segments.pop();
  return segments.length === 0 ? "/" : `/${segments.map(slugify).join("/")}`;
}

function slugify(segment: string): string {
  return segment
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Reads the small, declarative surface of MDX `Update` components without
 * evaluating MDX. The resulting data builds the changelog sidebar before the
 * page hydrates in the browser.
 */
export function changelogUpdatesFromMdx(source: string): ChangelogUpdate[] {
  return changelogEntriesFromMdx(source).map(({ id, label, tags }) => ({
    id,
    label,
    tags,
  }));
}

/**
 * Extracts the serialisable details of changelog entries without evaluating
 * MDX. RSS uses the same source as the changelog UI, so subscriptions stay in
 * sync with the published update anchors.
 */
export function changelogEntriesFromMdx(source: string): ChangelogEntry[] {
  const { body } = parseFrontmatter(source);
  const mdx = body.replace(/```[\s\S]*?```/g, "");
  const updates: ChangelogEntry[] = [];
  const usedIds = new Set<string>();
  const updateTag = /<Update\b/g;
  let match: RegExpExecArray | null;

  while ((match = updateTag.exec(mdx))) {
    const attributes = openingTagAttributes(mdx, updateTag.lastIndex);
    if (!attributes) continue;
    updateTag.lastIndex = attributes.end;

    const label = stringAttribute(attributes.value, "label");
    if (!label) continue;

    const baseId = slugify(label) || `update-${updates.length + 1}`;
    let id = baseId;
    let duplicate = 2;
    while (usedIds.has(id)) id = `${baseId}-${duplicate++}`;
    usedIds.add(id);

    const selfClosing = /\/$/.test(attributes.value.trim());
    const closingTag = selfClosing
      ? -1
      : mdx.indexOf("</Update>", attributes.end);
    const content =
      closingTag === -1 ? "" : mdx.slice(attributes.end, closingTag);

    const date = stringAttribute(attributes.value, "date");
    updates.push({
      id,
      label,
      tags: stringArrayAttribute(attributes.value, "tags"),
      ...(date ? { date } : {}),
      description: searchTextFromMdx(content),
    });

    if (closingTag !== -1)
      updateTag.lastIndex = closingTag + "</Update>".length;
  }

  return updates;
}

function openingTagAttributes(source: string, start: number) {
  let braceDepth = 0;
  let quote: '"' | "'" | undefined;

  for (let index = start; index < source.length; index++) {
    const character = source[index]!;
    if (quote) {
      if (character === "\\") {
        index++;
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "{") {
      braceDepth++;
      continue;
    }
    if (character === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (character === ">" && braceDepth === 0)
      return { end: index + 1, value: source.slice(start, index) };
  }

  return undefined;
}

function stringAttribute(attributes: string, name: string): string | undefined {
  const pattern = new RegExp(
    `\\b${name}\\s*=\\s*(?:"((?:\\\\.|[^"\\\\])*)"|'((?:\\\\.|[^'\\\\])*)')`,
  );
  const match = attributes.match(pattern);
  const value = match?.[1] ?? match?.[2];
  return value?.replace(/\\([\\"'])/g, "$1");
}

function stringArrayAttribute(attributes: string, name: string): string[] {
  const pattern = new RegExp(
    `\\b${name}\\s*=\\s*\\{\\s*\\[([\\s\\S]*?)\\]\\s*\\}`,
  );
  const contents = attributes.match(pattern)?.[1];
  if (!contents) return [];

  const values: string[] = [];
  const quotedValue = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g;
  let match: RegExpExecArray | null;
  while ((match = quotedValue.exec(contents))) {
    const value = (match[1] ?? match[2] ?? "")
      .replace(/\\([\\"'])/g, "$1")
      .trim();
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}

export function titleFromSlug(slug: string): string {
  if (slug === "/") return "Introduction";
  return slug
    .split("/")
    .filter(Boolean)
    .at(-1)!
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseFrontmatter(source: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: source };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!entry) continue;
    data[entry[1]] = entry[2].replace(/^(["'])(.*)\1$/, "$2").trim();
  }
  return { data, body: source.slice(match[0].length) };
}

export function tableOfContentsFromMdx(source: string): TableOfContentsItem[] {
  const { body } = parseFrontmatter(source);
  const headings: TableOfContentsItem[] = [];
  const usedIds = new Set<string>();
  let inCodeFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const match = line.match(/^(#{2,3})\s+(.+?)\s*#*$/);
    if (!match) continue;
    const title = match[2].replace(/[`*_]/g, "");
    const baseId = slugify(title);
    let id = baseId;
    let duplicate = 1;
    while (usedIds.has(id)) id = `${baseId}-${duplicate++}`;
    usedIds.add(id);
    headings.push({
      depth: match[1].length as 2 | 3,
      title,
      id,
    });
  }
  return headings;
}

/** Converts MDX into the plain text stored in the browser search index. */
export function searchTextFromMdx(source: string): string {
  const { body } = parseFrontmatter(source);

  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_~>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function pageFromSource(sourcePath: string, raw: string): ScannedPage {
  const { data, body } = parseFrontmatter(raw);
  const firstHeading = body.match(/^#\s+(.+)$/m)?.[1]?.replace(/[`*_]/g, "");
  const slug = slugFromFilePath(sourcePath);
  return {
    slug,
    title: data.title ?? firstHeading ?? titleFromSlug(slug),
    description: data.description ?? "",
    sourcePath,
    raw,
    tableOfContents: tableOfContentsFromMdx(raw),
    changelogUpdates: changelogUpdatesFromMdx(raw),
  };
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return MDX_EXTENSIONS.has(extname(entry.name).toLowerCase())
        ? [fullPath]
        : [];
    }),
  );
  return files.flat();
}

export async function findMdxFiles(
  contentDirectory: string,
): Promise<string[]> {
  return walk(resolve(contentDirectory));
}

export async function scanContent(
  contentDirectory: string,
): Promise<ScannedPage[]> {
  const absoluteDirectory = resolve(contentDirectory);
  const files = await findMdxFiles(absoluteDirectory);
  const pages = await Promise.all(
    files.map(async (file) => {
      const relativePath = relative(absoluteDirectory, file)
        .split(sep)
        .join("/");
      return pageFromSource(relativePath, await readFile(file, "utf8"));
    }),
  );
  return pages.sort((a, b) => a.slug.localeCompare(b.slug));
}
