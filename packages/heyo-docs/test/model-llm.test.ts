import { expect, test } from "bun:test";
import { createElement } from "react";

import { heyoDocs } from "../src/config";
import {
  findDocsPage,
  findOpenApiEndpoint,
  normaliseDocsPathname,
  createDocsModel,
} from "../src/model";
import {
  llmsFull,
  llmsIndex,
  markdownForPage,
  markdownPageForOpenApiEndpoint,
  markdownPathname,
  pathnameFromMarkdownPath,
} from "../src/llm";
import type { DocsPage, MarkdownPage, OpenApiEndpoint } from "../src/types";

const pages: DocsPage[] = [
  {
    slug: "/",
    sourcePath: "index.mdx",
    title: "Home",
    description: "Start here.",
    content: () => createElement("p"),
    tableOfContents: [],
    seo: { title: "Home", description: "Start here." },
  },
  {
    slug: "/guides/install",
    sourcePath: "guides/install.mdx",
    title: "Install",
    description: "Install the SDK.",
    content: () => createElement("p"),
    tableOfContents: [{ id: "install", title: "Install", depth: 2 }],
    seo: { title: "Install", description: "Install the SDK." },
  },
];

test("builds a minimal documentation model with normalized paths and default navigation", () => {
  const model = createDocsModel(
    heyoDocs({
      content: "content",
      title: "Acme Docs",
      description: "Acme documentation.",
      siteUrl: "https://docs.example.com/",
    }),
    pages,
  );

  expect(model.pages.map((page) => page.seo)).toEqual([
    {
      title: "Home | Acme Docs",
      description: "Start here.",
      canonical: "https://docs.example.com/",
    },
    {
      title: "Install | Acme Docs",
      description: "Install the SDK.",
      canonical: "https://docs.example.com/guides/install",
    },
  ]);
  expect(model.navigation).toEqual([
    {
      group: "Documentation",
      icon: "book",
      public: true,
      sections: [
        {
          expanded: true,
          pages: [
            { slug: "/", title: "Home" },
            { slug: "/guides/install", title: "Install" },
          ],
        },
      ],
    },
  ]);
  expect(normaliseDocsPathname("///guides/install///")).toBe("/guides/install");
  expect(findDocsPage(model.pages, "/guides/install/")?.title).toBe("Install");
  expect(findOpenApiEndpoint([], "/missing/")).toBeUndefined();
});

test("uses a supplied OpenAPI index without requiring full documents in the browser", () => {
  const endpoint: OpenApiEndpoint = {
    groupIndex: 0,
    sectionIndex: 0,
    slug: "/api/widgets/list-widgets",
    method: "get",
    path: "/widgets",
    title: "List widgets",
    tags: ["Widgets"],
    parameters: [],
    responses: [],
    security: [],
    servers: [],
    securitySchemes: {},
    document: { paths: {} },
  };
  const model = createDocsModel(
    heyoDocs({
      content: "content",
      groups: [{ group: "API", sections: [{ schema: "openapi.json" }] }],
    }),
    [],
    [],
    [endpoint],
  );

  expect(model.endpoints).toEqual([endpoint]);
  expect(
    findOpenApiEndpoint(model.endpoints, "/api/widgets/list-widgets/"),
  ).toBe(endpoint);
  expect(model.navigation[0]?.sections[0]?.pages).toEqual([
    {
      slug: "/api/widgets/list-widgets",
      title: "List widgets",
      method: "get",
    },
  ]);
});

test("round-trips Markdown resource paths and removes only leading frontmatter", () => {
  expect(markdownPathname("/guides/install/?tab=pnpm#setup")).toBe(
    "/guides/install.md",
  );
  expect(markdownPathname("/")).toBe("/index.md");
  expect(pathnameFromMarkdownPath("/index.md?download=1")).toBe("/");
  expect(pathnameFromMarkdownPath("/guides/install.md#copy")).toBe(
    "/guides/install",
  );
  expect(pathnameFromMarkdownPath("/guides/install.mdx")).toBeUndefined();

  const page: MarkdownPage = {
    slug: "/guide",
    title: "Guide",
    description: "",
    raw: "---\r\ntitle: Hidden\r\n---\r\n# Visible\r\n\r\n---\r\n",
  };
  expect(markdownForPage(page)).toBe("# Visible\r\n\r\n---\n");
});

test("generates safe, complete LLM Markdown for pages and OpenAPI endpoints", () => {
  const endpoint: OpenApiEndpoint = {
    groupIndex: 0,
    sectionIndex: 0,
    slug: "/api/widgets/create-widget",
    method: "post",
    path: "/widgets/{widgetId}",
    title: "Create widget",
    description: "Creates a widget.",
    tags: ["Widgets"],
    parameters: [
      {
        name: "widget|id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
        description: "The widget identifier.",
        deprecated: false,
      },
    ],
    requestBody: {
      contentType: "application/json",
      required: true,
      example: { name: "Ada" },
    },
    responses: [
      {
        status: "201",
        description: "Created",
        contentType: "application/json",
        example: { id: "widget_123" },
      },
    ],
    security: [],
    servers: [],
    securitySchemes: {},
    document: { paths: {} },
  };
  const apiPage = markdownPageForOpenApiEndpoint(endpoint);
  const docs: MarkdownPage[] = [
    {
      slug: "/",
      title: "Acme [Docs]",
      description: "Welcome.",
      raw: "# Home\n",
    },
    apiPage,
  ];

  expect(apiPage.raw).toContain("| widget\\|id | path | string (uuid) | Yes |");
  expect(apiPage.raw).toContain("## Request body");
  expect(apiPage.raw).toContain('"name": "Ada"');
  expect(apiPage.raw).toContain("### 201");
  expect(
    llmsIndex(
      docs,
      { title: "Acme", description: "Reference." },
      "https://docs.example.com/",
    ),
  ).toBe(
    "# Acme\n\n> Reference.\n\n## Documentation\n\n- [Acme \\[Docs\\]](https://docs.example.com/): Welcome.\n- [Create widget](https://docs.example.com/api/widgets/create-widget): Creates a widget.\n",
  );
  expect(llmsFull(docs, "https://docs.example.com/")).toContain(
    "# Create widget (https://docs.example.com/api/widgets/create-widget)",
  );
});
