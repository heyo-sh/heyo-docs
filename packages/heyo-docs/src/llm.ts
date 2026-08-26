import type { OpenApiEndpoint } from "./types";

/** A source page that can be exposed as Markdown without loading MDX in the browser. */
export interface MarkdownPage {
  slug: string;
  title: string;
  description: string;
  raw: string;
}

/**
 * Returns the stable Markdown representation for a documentation path.
 * `index.md` represents a root document, matching the convention used by
 * Fumadocs and keeping the root URL readable.
 */
export function markdownPathname(pathname: string): string {
  const normalised = normalisePathname(pathname);
  return normalised === "/" ? "/index.md" : `${normalised}.md`;
}

/** Decodes a `*.md` documentation path back to its regular page pathname. */
export function pathnameFromMarkdownPath(pathname: string): string | undefined {
  const normalised = normalisePathname(pathname);
  if (!normalised.endsWith(".md")) return undefined;

  const withoutExtension = normalised.slice(0, -".md".length);
  return withoutExtension === "/index" ? "/" : withoutExtension || "/";
}

/**
 * Produces the Markdown/MDX body of a page. Frontmatter is intentionally
 * removed: title and description are carried by the page model, while the body
 * retains authored Markdown and MDX components exactly as documented.
 */
export function markdownForPage(page: MarkdownPage): string {
  return page.raw
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "")
    .trim()
    .concat("\n");
}

/** Converts a generated API endpoint into the Markdown consumed by the LLM actions. */
export function markdownPageForOpenApiEndpoint(
  endpoint: OpenApiEndpoint,
): MarkdownPage {
  const lines = [
    `# ${endpoint.title}`,
    "",
    endpoint.description ?? "",
    endpoint.description ? "" : undefined,
    "## Endpoint",
    "",
    `\`${endpoint.method.toUpperCase()} ${endpoint.path}\``,
  ].filter((line): line is string => line !== undefined);

  if (endpoint.parameters.length) {
    lines.push(
      "",
      "## Parameters",
      "",
      "| Name | In | Type | Required |",
      "| --- | --- | --- | --- |",
    );
    for (const parameter of endpoint.parameters) {
      const schema = parameter.schema;
      const type = schema?.format
        ? `${schema.type ?? "string"} (${schema.format})`
        : (schema?.type ?? "string");
      lines.push(
        `| ${escapeTableCell(parameter.name)} | ${escapeTableCell(parameter.in)} | ${escapeTableCell(type)} | ${parameter.required ? "Yes" : "No"} |`,
      );
      if (parameter.description)
        lines.push("", `- **${parameter.name}:** ${parameter.description}`);
    }
  }

  if (endpoint.requestBody) {
    const body = endpoint.requestBody;
    lines.push(
      "",
      "## Request body",
      "",
      `Content type: \`${body.contentType}\`.`,
    );
    if (body.description) lines.push("", body.description);
    if (body.example !== undefined) {
      lines.push("", "```json", stringifyOpenApiValue(body.example), "```");
    }
  }

  if (endpoint.responses.length) {
    lines.push("", "## Responses", "");
    for (const response of endpoint.responses) {
      lines.push(`### ${response.status}`, "");
      if (response.description) lines.push(response.description, "");
      if (response.contentType)
        lines.push(`Content type: \`${response.contentType}\`.`, "");
      if (response.example !== undefined)
        lines.push(
          "```json",
          stringifyOpenApiValue(response.example),
          "```",
          "",
        );
    }
    while (lines.at(-1) === "") lines.pop();
  }

  return {
    slug: endpoint.slug,
    title: endpoint.title,
    description:
      endpoint.description ??
      `${endpoint.method.toUpperCase()} ${endpoint.path}`,
    raw: `${lines.join("\n").trim()}\n`,
  };
}

/** Formats a single page for inclusion in `llms-full.txt`. */
export function llmTextForPage(page: MarkdownPage, siteUrl: string): string {
  const url = absolutePageUrl(siteUrl, page.slug);
  return `# ${page.title} (${url})\n\n${markdownForPage(page).trim()}`;
}

/** Creates a standards-friendly `llms.txt` index for all discovered pages. */
export function llmsIndex(
  pages: MarkdownPage[],
  site: Pick<{ title: string; description: string }, "title" | "description">,
  siteUrl: string,
): string {
  const lines = [`# ${site.title}`, ""];
  if (site.description) lines.push(`> ${site.description}`, "");
  lines.push("## Documentation", "");

  for (const page of pages) {
    const title = escapeMarkdownLinkText(page.title);
    const url = absolutePageUrl(siteUrl, page.slug);
    const description = page.description.trim();
    lines.push(
      description
        ? `- [${title}](${url}): ${description}`
        : `- [${title}](${url})`,
    );
  }

  return `${lines.join("\n").trim()}\n`;
}

/** Creates the complete concatenated documentation source for LLM consumers. */
export function llmsFull(pages: MarkdownPage[], siteUrl: string): string {
  return `${pages
    .map((page) => llmTextForPage(page, siteUrl))
    .join("\n\n")
    .trim()}\n`;
}

function normalisePathname(pathname: string): string {
  const withoutQueryOrHash = pathname.split(/[?#]/, 1)[0] ?? "";
  const segments = withoutQueryOrHash.split("/").filter(Boolean);
  return segments.length ? `/${segments.join("/")}` : "/";
}

function absolutePageUrl(siteUrl: string, pathname: string): string {
  return new URL(normalisePathname(pathname), `${siteUrl.replace(/\/$/, "")}/`)
    .toString()
    .replace(/\/$/, pathname === "/" ? "/" : "");
}

function escapeMarkdownLinkText(value: string): string {
  return value.replace(/([\[\]])/g, "\\$1");
}

function escapeTableCell(value: string): string {
  return value.replaceAll("|", "\\|");
}

function stringifyOpenApiValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}
