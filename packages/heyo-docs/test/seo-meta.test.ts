import { expect, test } from "bun:test";

import {
  docsSeoMeta,
  sitemapPaths,
} from "../../../examples/react-router/app/lib/seo";
import type {
  ChangelogGroupConfig,
  DocsPage,
  HeyoDocsConfig,
  NavigationGroup,
  OpenApiEndpoint,
} from "../src/types";

const config: HeyoDocsConfig = {
  title: "Acme Docs",
  description: "Documentation for Acme.",
  theme: "grain",
  colors: {},
  groups: [],
  footer: {},
  mode: "system",
  content: "./content",
  branding: { name: "Acme Docs" },
  siteUrl: "https://docs.example.com",
  integrations: { analytics: {}, support: {}, consent: {} },
};

function jsonLd(meta: ReturnType<typeof docsSeoMeta>) {
  const descriptor = meta.find((item) => "script:ld+json" in item);
  if (!descriptor || !("script:ld+json" in descriptor))
    throw new Error("Expected JSON-LD metadata.");
  return descriptor["script:ld+json"];
}

test("uses APIReference JSON-LD and a canonical URL for OpenAPI endpoints", () => {
  const endpoint: OpenApiEndpoint = {
    groupIndex: 0,
    sectionIndex: 0,
    slug: "/api/planets/list-planets",
    method: "get",
    path: "/planets",
    title: "List planets",
    operationId: "listPlanets",
    tags: ["Planets"],
    parameters: [],
    responses: [{ status: "200", contentType: "application/json" }],
    security: [],
    servers: ["https://api.example.com/v1"],
    securitySchemes: {},
    document: { paths: {} },
  };
  const meta = docsSeoMeta({
    config,
    endpoint,
    pathname: endpoint.slug,
  });

  expect(meta).toContainEqual({
    tagName: "link",
    rel: "canonical",
    href: "https://docs.example.com/api/planets/list-planets",
  });
  expect(jsonLd(meta)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        "@type": "APIReference",
        mainEntity: expect.objectContaining({
          "@type": "EntryPoint",
          httpMethod: "GET",
          urlTemplate: "https://api.example.com/v1/planets",
        }),
      }),
      expect.objectContaining({ "@type": "BreadcrumbList" }),
    ]),
  );
});

test("uses a collection JSON-LD model for changelog entries", () => {
  const page: DocsPage = {
    slug: "/changelog",
    title: "Changelog",
    description: "Recent product updates.",
    content: () => null,
    tableOfContents: [],
    seo: {
      title: "Changelog | Acme Docs",
      description: "Recent product updates.",
      canonical: "https://docs.example.com/changelog",
    },
    changelogUpdates: [
      { id: "march-2026", label: "March 2026", tags: ["Bug fixes"] },
    ],
  };
  const changelogGroup: ChangelogGroupConfig = {
    type: "changelog",
    group: "Changelog",
    public: true,
    updates: ["changelog.mdx"],
  };

  expect(
    jsonLd(
      docsSeoMeta({
        changelogGroup,
        config,
        page,
        pathname: page.slug,
      }),
    ),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        "@type": "CollectionPage",
        hasPart: [
          expect.objectContaining({
            headline: "March 2026",
            keywords: "Bug fixes",
            url: "https://docs.example.com/changelog#march-2026",
          }),
        ],
      }),
    ]),
  );
});

test("matches breadcrumb JSON-LD to the documentation navigation hierarchy", () => {
  const page: DocsPage = {
    slug: "/guides/install",
    title: "Install the SDK",
    description: "Install the SDK.",
    content: () => null,
    tableOfContents: [],
    seo: {
      title: "Install the SDK | Acme Docs",
      description: "Install the SDK.",
      canonical: "https://docs.example.com/guides/install",
    },
  };
  const navigation: NavigationGroup[] = [
    {
      group: "Product guides",
      public: true,
      sections: [
        {
          section: "Get started",
          expanded: true,
          pages: [
            { slug: "/guides/intro", title: "Introduction" },
            { slug: page.slug, title: page.title },
          ],
        },
      ],
    },
  ];

  expect(
    jsonLd(
      docsSeoMeta({
        config,
        navigation,
        page,
        pathname: page.slug,
      }),
    ),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        "@type": "BreadcrumbList",
        itemListElement: [
          expect.objectContaining({
            position: 1,
            name: "Acme Docs",
            item: "https://docs.example.com",
          }),
          expect.objectContaining({
            position: 2,
            name: "Product guides",
            item: "https://docs.example.com/guides/intro",
          }),
          expect.objectContaining({
            position: 3,
            name: "Get started",
            item: "https://docs.example.com/guides/intro",
          }),
          expect.objectContaining({
            position: 4,
            name: "Install the SDK",
            item: "https://docs.example.com/guides/install",
          }),
        ],
      }),
    ]),
  );
});

test("includes every nested section in breadcrumb JSON-LD", () => {
  const page: DocsPage = {
    slug: "/guides/deploy",
    title: "Deploy safely",
    description: "Deploy safely.",
    content: () => null,
    tableOfContents: [],
    seo: {
      title: "Deploy safely | Acme Docs",
      description: "Deploy safely.",
      canonical: "https://docs.example.com/guides/deploy",
    },
  };
  const navigation: NavigationGroup[] = [
    {
      group: "Product guides",
      public: true,
      sections: [
        {
          section: "Get started",
          expanded: true,
          pages: [
            {
              section: "Advanced",
              expanded: true,
              pages: [{ slug: page.slug, title: page.title }],
            },
          ],
        },
      ],
    },
  ];

  expect(
    jsonLd(
      docsSeoMeta({
        config,
        navigation,
        page,
        pathname: page.slug,
      }),
    ),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        "@type": "BreadcrumbList",
        itemListElement: [
          expect.objectContaining({ position: 1, name: "Acme Docs" }),
          expect.objectContaining({ position: 2, name: "Product guides" }),
          expect.objectContaining({ position: 3, name: "Get started" }),
          expect.objectContaining({ position: 4, name: "Advanced" }),
          expect.objectContaining({ position: 5, name: "Deploy safely" }),
        ],
      }),
    ]),
  );
});

test("includes generated OpenAPI routes in the sitemap", () => {
  expect(
    sitemapPaths({
      pages: [{ slug: "/guide" }],
      endpoints: [{ slug: "/api/planets/list-planets" }],
    }),
  ).toEqual(["/guide", "/api/planets/list-planets"]);
});
