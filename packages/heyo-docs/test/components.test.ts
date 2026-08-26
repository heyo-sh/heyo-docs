import { expect, test } from "bun:test";
import { evaluate } from "@mdx-js/mdx";
import {
  createElement,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

import { heyoDocs as defineHeyoDocs } from "../src/config";
import { DocsApp } from "../src/index";
import { PageNavigation } from "../src/theme/components/actions/navigation";
import { OpenApiDescription } from "../src/theme/components/openapi/description";
import type {
  DocsPage,
  IconComponent,
  IconSet,
  MdxComponents,
  OpenApiDocumentSource,
  UserHeyoDocsConfig,
} from "../src/types";

const TestIcon: IconComponent = (props) =>
  createElement("svg", { "data-icon-set": "test", ...props });
const iconSet = { github: TestIcon } satisfies IconSet;

const heyoDocs = (config: Omit<UserHeyoDocsConfig, "content">) =>
  defineHeyoDocs({ content: "./content", ...config });

const pages: DocsPage[] = [
  {
    slug: "/",
    title: "Home",
    description: "The home page.",
    content: () => createElement("p", null, "Page body"),
    tableOfContents: [],
    seo: { title: "Home", description: "The home page." },
  },
];

function breadcrumbMarkup(html: string) {
  const start = html.indexOf('data-slot="breadcrumb"');
  const end = html.indexOf("</nav>", start);
  return html.slice(start, end);
}

test("renders the built-in theme components", () => {
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        branding: { name: "Custom docs" },
        navigation: createElement(
          "a",
          { href: "https://github.com/acme" },
          "GitHub",
        ),
        footer: { website: "https://example.com" },
        groups: [
          {
            group: "Documentation",
            sections: [{ section: "Guides", pages: ["index"] }],
          },
        ],
      }),
      iconSet,
      pages: [{ ...pages[0]!, sourcePath: "index.mdx" }],
      pathname: "/",
    }),
  );

  expect(html).toContain("Custom docs");
  expect(html).toContain('data-slot="heyo-docs-logo"');
  expect(html).not.toContain('data-slot="heyo-docs-logo-mark"');
  expect(html).not.toContain('data-slot="heyo-docs-logo-wordmark"');
  expect(html).toContain("Guides");
  expect(html).toContain('aria-label="Breadcrumb"');
  expect(html).toContain('href="https://github.com/acme"');
  expect(html).toContain("GitHub");
  expect(html).toContain('aria-keyshortcuts="Control+K Meta+K"');
  expect(html).toContain('aria-label="Website"');
  expect(html).toContain("Page body");
});

test("places Shade navigation controls in the header and uses native sidebar buttons", () => {
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        branding: { name: "Custom docs" },
        footer: { github: "https://github.com/acme" },
        groups: [
          {
            group: "Documentation",
            sections: [{ pages: ["index"] }],
          },
          {
            group: "Reference",
            sections: [{ pages: ["reference"] }],
          },
        ],
        navigation: createElement(
          "a",
          { href: "https://example.com/sign-in" },
          "Sign in",
        ),
        theme: "shade",
      }),
      isDark: true,
      pages: [
        { ...pages[0]!, sourcePath: "index.mdx" },
        {
          ...pages[0]!,
          slug: "/reference",
          sourcePath: "reference.mdx",
          title: "Reference page",
        },
      ],
      pathname: "/",
    }),
  );

  expect(html).toContain('aria-label="Documentation groups"');
  expect(html).not.toContain('data-slot="dropdown-menu"');
  expect(html).toContain('aria-label="Use light theme"');
  expect(html).toContain("bg-secondary text-secondary-foreground");
  expect(html).toContain(
    "bg-gradient-to-b from-border/0 via-border to-border/0",
  );
  expect(html).toContain('aria-label="Documentation navigation" class="my-10"');
  expect(html).toContain(
    "h-8 cursor-pointer border-0 bg-secondary px-3 text-xs shadow-none",
  );
  expect(html.indexOf("aria-keyshortcuts")).toBeLessThan(
    html.indexOf("https://example.com/sign-in"),
  );
});

test("places Moss search and footer links in the sidebar with centered header tabs", () => {
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        branding: { name: "Moss docs" },
        colors: { primary: "#2f855a" },
        footer: {
          github: "https://github.com/acme",
          website: "https://example.com",
        },
        groups: [
          {
            group: "Documentation",
            sections: [{ section: "Start here", pages: ["index"] }],
          },
          {
            group: "Reference",
            sections: [{ pages: ["reference"] }],
          },
        ],
        theme: "moss",
      }),
      isDark: true,
      pages: [
        { ...pages[0]!, sourcePath: "index.mdx" },
        {
          ...pages[0]!,
          slug: "/reference",
          sourcePath: "reference.mdx",
          title: "Reference page",
        },
      ],
      pathname: "/",
    }),
  );

  expect(html).toContain('aria-label="Documentation groups"');
  expect(html).toContain('aria-label="Search documentation"');
  expect(html).toContain("rounded-lg border border-border bg-muted/45");
  expect(html).toContain("before:bg-primary");
  expect(html).toContain('aria-label="Website"');
  expect(html).toContain('aria-label="GitHub"');
  expect(html).toContain('aria-label="Use light theme"');
  expect(html).toContain("--primary:#2f855a");
  expect(html.indexOf('aria-label="Search documentation"')).toBeLessThan(
    html.indexOf('aria-label="Website"'),
  );
});

test("renders registered custom components from compiled MDX in documentation and changelog pages", async () => {
  const mdxComponents = {
    FeatureCard({ children, title }: { children?: ReactNode; title: string }) {
      return createElement(
        "article",
        { "data-slot": "custom-feature-card" },
        createElement("h2", null, title),
        children,
      );
    },
    FeatureCards({ children }: { children?: ReactNode }) {
      return createElement(
        "section",
        { "data-slot": "custom-feature-cards" },
        children,
      );
    },
  } satisfies MdxComponents;
  const runtime = { Fragment, jsx, jsxs };
  const { default: DocumentationContent } = await evaluate(
    `<FeatureCards>
  <FeatureCard title="Application-owned">Custom MDX content</FeatureCard>
</FeatureCards>`,
    runtime,
  );
  const { default: ChangelogContent } = await evaluate(
    `<Update label="August 2026">
  <FeatureCards>
    <FeatureCard title="Changelog support">The same component works here.</FeatureCard>
  </FeatureCards>
</Update>`,
    runtime,
  );
  const documentationPage: DocsPage = {
    ...pages[0]!,
    content: DocumentationContent as DocsPage["content"],
    sourcePath: "index.mdx",
  };
  const changelogPage: DocsPage = {
    ...pages[0]!,
    changelogUpdates: [{ id: "august-2026", label: "August 2026", tags: [] }],
    content: ChangelogContent as DocsPage["content"],
    slug: "/changelog",
    sourcePath: "changelog.mdx",
    title: "Changelog",
  };
  const config = heyoDocs({
    groups: [
      {
        group: "Documentation",
        sections: [{ pages: ["index"] }],
      },
      {
        group: "Changelog",
        type: "changelog",
        updates: ["changelog"],
      },
    ],
  });

  const documentationHtml = renderToStaticMarkup(
    createElement(DocsApp, {
      config,
      mdxComponents,
      pages: [documentationPage, changelogPage],
      pathname: "/",
    }),
  );
  const changelogHtml = renderToStaticMarkup(
    createElement(DocsApp, {
      config,
      mdxComponents,
      pages: [documentationPage, changelogPage],
      pathname: "/changelog",
    }),
  );

  expect(documentationHtml).toContain('data-slot="custom-feature-cards"');
  expect(documentationHtml).toContain("Application-owned");
  expect(changelogHtml).toContain('data-slot="custom-feature-cards"');
  expect(changelogHtml).toContain("Changelog support");
});

test("uses a Sheet for mobile navigation while keeping the desktop sidebar separate", () => {
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Documentation",
            sections: [{ section: "Guides", pages: ["index"] }],
          },
        ],
      }),
      pages: [{ ...pages[0]!, sourcePath: "index.mdx" }],
      pathname: "/",
    }),
  );

  expect(html).toContain('data-slot="sheet-trigger"');
  expect(html).toContain('aria-label="Open documentation navigation"');
  expect(html).toContain('class="hidden min-w-0 flex-1 lg:flex"');
  expect(html).toContain(
    'class="hidden lg:block heyo-docs-enter heyo-docs-enter--navigation"',
  );
});

test("renders unsectioned pages directly in the Grain sidebar", () => {
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Documentation",
            sections: [{ pages: ["index"] }],
          },
        ],
      }),
      pages: [{ ...pages[0]!, sourcePath: "index.mdx" }],
      pathname: "/",
    }),
  );
  const breadcrumb = breadcrumbMarkup(html);

  expect(html).toContain('href="/"');
  expect(html).toContain('style="padding-left:1rem"');
  expect(html).not.toContain('data-slot="collapsible-trigger"');
  expect(breadcrumb).toContain("Documentation");
  expect(breadcrumb).toContain("Home");
});

test("renders the configured icon beside an individual documentation page", () => {
  const PageIcon: IconComponent = (props) =>
    createElement("svg", { "data-page-icon": "true", ...props });
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Documentation",
            sections: [
              {
                pages: ["index", { page: "quickstart", icon: "book" }],
              },
            ],
          },
        ],
      }),
      iconSet: { book: PageIcon },
      pages: [
        { ...pages[0]!, sourcePath: "index.mdx" },
        {
          ...pages[0]!,
          slug: "/quickstart",
          sourcePath: "quickstart.mdx",
          title: "Quickstart",
        },
      ],
      pathname: "/quickstart",
    }),
  );

  expect(html).toContain("Quickstart");
  expect(html.match(/data-page-icon/g)).toHaveLength(1);
  expect(html).toContain('aria-current="page"');
});

test("renders custom sidebar links with their configured destination", () => {
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Documentation",
            sections: [
              {
                section: "Guides",
                pages: [
                  "index",
                  { title: "Admin panel", src: "https://app.example.com" },
                ],
              },
            ],
          },
        ],
      }),
      pages: [{ ...pages[0]!, sourcePath: "index.mdx" }],
      pathname: "/",
    }),
  );

  expect(html).toContain('href="https://app.example.com"');
  expect(html).toContain("Admin panel");
});

test("uses the host router link for internal documentation navigation", () => {
  const RouterLink: ComponentType<ComponentPropsWithoutRef<"a">> = ({
    children,
    ...props
  }) => createElement("a", { ...props, "data-router-link": "true" }, children);
  const guidePage = {
    ...pages[0]!,
    slug: "/guides/installation",
    sourcePath: "guides/installation.mdx",
    title: "Installation",
  };
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Documentation",
            sections: [
              {
                section: "Guides",
                pages: ["index", "guides/installation"],
              },
            ],
          },
        ],
      }),
      link: RouterLink,
      pages: [{ ...pages[0]!, sourcePath: "index.mdx" }, guidePage],
      pathname: "/",
    }),
  );

  expect(html).toContain('data-router-link="true"');
  expect(html).toContain('href="/guides/installation"');
});

test("renders nested sections in the Grain sidebar and breadcrumbs", () => {
  const nestedPage = {
    ...pages[0]!,
    slug: "/guides/deploy",
    sourcePath: "guides/deploy.mdx",
    title: "Deploy safely",
  };
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Documentation",
            sections: [
              {
                section: "Guides",
                pages: [
                  {
                    section: "Advanced",
                    pages: [
                      {
                        section: "Deployment",
                        pages: [
                          {
                            title: "Deployment dashboard",
                            src: "https://app.example.com/deployments",
                          },
                          "guides/deploy",
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
      pages: [nestedPage],
      pathname: "/guides/deploy",
    }),
  );
  const breadcrumb = breadcrumbMarkup(html);

  expect(html).toContain("Advanced");
  expect(html).toContain("Deployment");
  expect(html).toContain('href="https://app.example.com/deployments"');
  expect(html).toContain('style="padding-left:1.75rem"');
  expect(breadcrumb).toContain("Guides");
  expect(breadcrumb).toContain("Advanced");
  expect(breadcrumb).toContain("Deployment");
  expect(breadcrumb).toContain("Deploy safely");
});

test("renders the supplied navigation element", () => {
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        navigation: createElement(TestIcon),
      }),
      iconSet,
      pages,
      pathname: "/",
    }),
  );

  expect(html).toContain('data-icon-set="test"');
});

test("renders bordered page navigation and the heyo-docs credit", () => {
  const html = renderToStaticMarkup(
    createElement(PageNavigation, {
      previous: { href: "/previous", title: "Previous page" },
      next: { href: "/next", title: "Next page" },
    }),
  );

  expect(html).toContain("rounded-md border");
  expect(html).toContain('href="https://heyo-docs.com"');
  expect(html).toContain("Powered by");
});

test("keeps the heyo-docs credit when a page has no adjacent pages", () => {
  const html = renderToStaticMarkup(createElement(PageNavigation, {}));

  expect(html).toContain("Powered by");
  expect(html).not.toContain('aria-label="Page navigation"');
  expect(html).toContain("mt-12");
});

test("renders usable labels for OpenAPI schema references in descriptions", () => {
  const html = renderToStaticMarkup(
    createElement(OpenApiDescription, {
      children:
        "Uses [](#/components/schemas/BankAccount) and [](#/definitions/LegacyModel).",
      document: {
        components: { schemas: { BankAccount: { type: "object" } } },
        definitions: { LegacyModel: { type: "object" } },
        paths: {},
      },
    }),
  );

  expect(html).toContain("BankAccount");
  expect(html).toContain("LegacyModel");
  expect(html).not.toContain("></button>");
});

test("renders unsupported OpenAPI endpoint references as plain text", () => {
  const html = renderToStaticMarkup(
    createElement(OpenApiDescription, {
      children:
        "See [SearchCatalogObjects](api-endpoint:Catalog-SearchCatalogObjects).",
    }),
  );

  expect(html).toContain("See SearchCatalogObjects.");
  expect(html).not.toContain("<a");
  expect(html).not.toContain("api-endpoint:");
});

test("scopes sidebar navigation to the active documentation group", () => {
  const groupedPages: DocsPage[] = [
    {
      ...pages[0]!,
      slug: "/guides/intro",
      sourcePath: "guides/intro.mdx",
      title: "Introduction",
    },
    {
      ...pages[0]!,
      slug: "/reference/auth",
      sourcePath: "reference/auth.mdx",
      title: "Authentication",
    },
  ];
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Guides",
            sections: [{ section: "Start", pages: ["guides/intro"] }],
          },
          {
            group: "Reference",
            sections: [{ section: "API", pages: ["reference/auth"] }],
          },
        ],
      }),
      pages: groupedPages,
      pathname: "/guides/intro",
    }),
  );

  expect(html).toContain("Start");
  expect(html).toContain("Introduction");
  expect(html).not.toContain("Reference");
  expect(html).not.toContain("Authentication");
});

test("shows the active section in the Grain sidebar header", () => {
  const groupedPages: DocsPage[] = [
    {
      ...pages[0]!,
      slug: "/guides/intro",
      sourcePath: "guides/intro.mdx",
      title: "Introduction",
    },
    {
      ...pages[0]!,
      slug: "/reference/auth",
      sourcePath: "reference/auth.mdx",
      title: "Authentication",
    },
  ];
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Documentation",
            sections: [
              { section: "Getting started", pages: ["guides/intro"] },
              { section: "API reference", pages: ["reference/auth"] },
            ],
          },
        ],
      }),
      pages: groupedPages,
      pathname: "/reference/auth",
    }),
  );

  expect(html).toContain(
    '<span class="min-w-0 flex-1 truncate">API reference</span>',
  );
});

test("renders group, section, and page breadcrumbs in the Grain header", () => {
  const groupedPages: DocsPage[] = [
    {
      ...pages[0]!,
      slug: "/guides/intro",
      sourcePath: "guides/intro.mdx",
      title: "Introduction",
    },
    {
      ...pages[0]!,
      slug: "/guides/install",
      sourcePath: "guides/install.mdx",
      title: "Install the SDK",
    },
  ];
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Product guides",
            sections: [
              {
                section: "Get started",
                pages: ["guides/intro", "guides/install"],
              },
            ],
          },
        ],
      }),
      pages: groupedPages,
      pathname: "/guides/install",
    }),
  );
  const breadcrumb = breadcrumbMarkup(html);

  expect(breadcrumb).toContain("Product guides");
  expect(breadcrumb).toContain("Get started");
  expect(breadcrumb).toContain("Install the SDK");
  expect(breadcrumb).toContain('data-slot="breadcrumb-separator"');
  expect(breadcrumb).toContain('href="/guides/intro"');
});

test("uses changelog group metadata and renders tags below their dates", () => {
  const ChangelogContent: DocsPage["content"] = ({ components }) => {
    const Update = components?.Update as ComponentType<{
      children?: string;
      label: string;
      tags?: string[];
    }>;
    return createElement(
      Update,
      {
        label: "March 2026",
        tags: ["New releases"],
      },
      "A new release.",
    );
  };
  const changelogPage: DocsPage = {
    content: ChangelogContent,
    description: "Latest product changes.",
    changelogUpdates: [
      {
        id: "march-2026",
        label: "March 2026",
        tags: ["New releases"],
      },
    ],
    seo: { title: "Legacy page title", description: "Latest product changes." },
    slug: "/changelog",
    sourcePath: "changelog.mdx",
    tableOfContents: [],
    title: "Legacy page title",
  };
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Documentation",
            sections: [{ section: "Start", pages: ["index"] }],
          },
          {
            group: "Release notes",
            description: "Everything new in one place.",
            type: "changelog",
            updates: ["changelog.mdx"],
          },
        ],
      }),
      pages: [{ ...pages[0]!, sourcePath: "index.mdx" }, changelogPage],
      pathname: "/changelog",
    }),
  );

  expect(html).toContain('aria-label="Changelog entries"');
  expect(html).toContain(
    '<span class="min-w-0 flex-1 truncate">Release notes</span>',
  );
  expect(html).toContain("March 2026");
  expect(html).toContain("Release notes");
  expect(html).toContain("Everything new in one place.");
  expect(html).toContain("Filter updates");
  expect(html).toContain("gap-x-1.5 gap-y-[3px]");
  expect(html).toContain("flex flex-col items-start gap-1.5");
  expect(html).not.toContain("v1.0.0");
  expect(html).not.toContain("Start");

  const breadcrumb = breadcrumbMarkup(html);
  expect(breadcrumb).toContain("Release notes");
  expect(breadcrumb).not.toContain("Updates");
  expect(breadcrumb).not.toContain("Legacy page title");
});

test("uses a helpful default description for changelog groups", () => {
  const changelogPage: DocsPage = {
    ...pages[0]!,
    changelogUpdates: [],
    slug: "/changelog",
    sourcePath: "changelog.mdx",
  };
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [
          {
            group: "Changelog",
            type: "changelog",
            updates: ["changelog.mdx"],
          },
        ],
      }),
      pages: [changelogPage],
      pathname: "/changelog",
    }),
  );

  expect(html).toContain(
    "Stay up to date with the latest changes and improvements.",
  );
});

test("adds page navigation to OpenAPI endpoints and only a credit to changelogs", () => {
  const apiOverview: DocsPage = {
    ...pages[0]!,
    slug: "/api-overview",
    sourcePath: "api-overview.mdx",
    title: "API overview",
  };
  const changelog: DocsPage = {
    ...pages[0]!,
    slug: "/changelog",
    sourcePath: "changelog.mdx",
    title: "Changelog",
  };
  const config = heyoDocs({
    groups: [
      {
        group: "API",
        sections: [
          { section: "Start", pages: ["api-overview"] },
          { schema: "./openapi.json" },
        ],
      },
      {
        group: "Changelog",
        type: "changelog",
        updates: ["changelog.mdx"],
      },
    ],
  });
  const openApiDocuments: OpenApiDocumentSource[] = [
    {
      groupIndex: 0,
      sectionIndex: 1,
      schema: "./openapi.json",
      document: {
        openapi: "3.1.0",
        paths: {
          "/planets": {
            get: { operationId: "listPlanets", summary: "List planets" },
          },
        },
      },
    },
  ];

  const openApiHtml = renderToStaticMarkup(
    createElement(DocsApp, {
      config,
      openApiDocuments,
      pages: [apiOverview, changelog],
      pathname: "/api/planets/list-planets",
    }),
  );
  const changelogHtml = renderToStaticMarkup(
    createElement(DocsApp, {
      config,
      openApiDocuments,
      pages: [apiOverview, changelog],
      pathname: "/changelog",
    }),
  );
  const apiOverviewHtml = renderToStaticMarkup(
    createElement(DocsApp, {
      config,
      openApiDocuments,
      pages: [apiOverview, changelog],
      pathname: "/api-overview",
    }),
  );

  expect(openApiHtml).toContain('aria-label="Page navigation"');
  expect(openApiHtml).toContain('href="/api-overview"');
  expect(apiOverviewHtml).toContain('aria-label="Page navigation"');
  expect(apiOverviewHtml).toContain('href="/api/planets/list-planets"');
  expect(apiOverviewHtml).toContain("Powered by");
  expect(changelogHtml).toContain("Powered by");
  expect(changelogHtml).not.toContain('aria-label="Page navigation"');
  expect(changelogHtml).toContain('class="mb-6 mt-12"');
});

test("renders an interactive OpenAPI endpoint with Bearer auth and request body", () => {
  const openApiDocuments: OpenApiDocumentSource[] = [
    {
      groupIndex: 0,
      sectionIndex: 0,
      schema: "./openapi.json",
      document: {
        openapi: "3.1.0",
        info: { title: "Square" },
        security: [{ BearerAuth: [] }],
        servers: [{ url: "https://api.example.com/v1" }],
        paths: {
          "/organizations/{organizationId}/planets": {
            post: {
              operationId: "createPlanet",
              summary: "Create a planet",
              description:
                "<p>When a meter is <strong>reactivated</strong>, it can accept events.</p>\n\nReturns details of a [BankAccount](entity:BankAccount).",
              tags: ["Planets"],
              parameters: [
                {
                  in: "path",
                  name: "organizationId",
                  required: true,
                  schema: { example: "org_123", type: "string" },
                },
              ],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { name: { example: "Mars", type: "string" } },
                    },
                  },
                },
              },
              responses: {
                "201": {
                  content: {
                    "application/json": {
                      schema: { $ref: "#/components/schemas/BankAccount" },
                    },
                  },
                  description: "Created",
                },
              },
            },
          },
        },
        components: {
          securitySchemes: {
            BearerAuth: { scheme: "bearer", type: "http" },
          },
          schemas: {
            BankAccount: {
              description: "A linked bank account.",
              properties: {
                id: { description: "The bank account ID.", type: "string" },
                status: { enum: ["VERIFIED", "DISABLED"], type: "string" },
              },
              required: ["id"],
              type: "object",
            },
          },
        },
      },
    },
  ];
  const html = renderToStaticMarkup(
    createElement(DocsApp, {
      config: heyoDocs({
        groups: [{ group: "API", sections: [{ schema: "./openapi.json" }] }],
      }),
      openApiDocuments,
      pages: [],
      pathname: "/api/planets/create-planet/",
    }),
  );

  expect(html).toContain("Create a planet");
  expect(html).toContain("When a meter is");
  expect(html).toContain("<strong>reactivated</strong>");
  expect(html).toContain("BankAccount");
  expect(html).toContain('aria-haspopup="dialog"');
  expect(html).not.toContain("&lt;p&gt;When a meter");
  expect(html).toContain("Bearer token");
  expect(html).toContain('aria-label="Request body"');
  expect(html).toContain('class="not-prose my-0 mt-6"');
  expect(html).toContain("Send request");
  expect(html).toContain("cURL");
  expect(html).toContain("POST");
  expect(html).toContain("Copy for LLM");
  expect(html).toContain("base URL");
  expect(html).toContain('data-slot="properties"');
  expect(html).toContain('<span class="min-w-0 flex-1 truncate">API</span>');
  expect(html).toContain('aria-current="page"');
  expect(html).toContain('data-slot="textarea"');
  expect(html).toContain("min-h-12 max-h-52");
  const apiServerProperty = html.slice(
    html.indexOf("API server"),
    html.indexOf("Bearer token"),
  );
  expect(apiServerProperty).not.toContain("optional");
});
