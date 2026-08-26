import { describe, expect, test } from "bun:test";
import { createElement } from "react";

import { heyoDocs, validateConfig } from "../src/config";

describe("configuration", () => {
  test("applies stable defaults around the required content directory", () => {
    expect(heyoDocs({ content: "./docs" })).toEqual({
      title: "Heyo Documentation",
      description: "Clear, focused documentation for your project.",
      theme: "grain",
      colors: {},
      navigation: undefined,
      groups: [],
      footer: {},
      mode: "system",
      content: "./docs",
      branding: { name: "Heyo Documentation" },
      siteUrl: undefined,
    });
  });

  test("requires an explicit content directory", () => {
    expect(() => validateConfig({} as never)).toThrow(/content/i);
    expect(() => validateConfig({ content: "  " } as never)).toThrow(
      "A content directory must be provided.",
    );
  });

  test("rejects runtime font and icon-pack selection", () => {
    expect(() => validateConfig({ font: "inter" } as never)).toThrow();
    expect(() =>
      validateConfig({ iconLibrary: "remixIcons" } as never),
    ).toThrow();
  });

  test("rejects an invalid site URL", () => {
    expect(() =>
      validateConfig({
        content: "./content",
        title: "API",
        siteUrl: "not a URL",
      }),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        title: "API",
        siteUrl: "mailto:docs@example.com",
      }),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        title: "API",
        siteUrl: "https://docs.example.com/#api",
      }),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        title: "API",
        siteUrl: "https://docs.example.com?lang=pl",
      }),
    ).toThrow();
  });

  test("accepts and normalises an HTTP(S) site URL", () => {
    expect(
      heyoDocs({
        content: "./content",
        siteUrl: "https://docs.example.com/api/",
      }).siteUrl,
    ).toBe("https://docs.example.com/api");
  });

  test("accepts only the built-in theme", () => {
    expect(() => validateConfig({ theme: {} } as never)).toThrow();
    expect(() => validateConfig({ theme: "custom" } as never)).toThrow();
  });

  test("normalises group sections without changing configured order", () => {
    expect(
      heyoDocs({
        content: "./content",
        groups: [
          {
            group: "Documentation",
            icon: "globe",
            sections: [
              {
                section: "Start here",
                pages: ["getting-started", "installation"],
              },
            ],
          },
          {
            group: "API Reference",
            sections: [{ schema: "/openapi.json" }],
          },
          {
            group: "Changelog",
            description: "Everything that changed in the product.",
            type: "changelog",
            updates: ["updates"],
          },
        ],
      }).groups,
    ).toEqual([
      {
        group: "Documentation",
        icon: "globe",
        public: true,
        type: "documentation",
        sections: [
          {
            section: "Start here",
            expanded: true,
            pages: ["getting-started", "installation"],
          },
        ],
      },
      {
        group: "API Reference",
        public: true,
        type: "documentation",
        sections: [{ schema: "/openapi.json" }],
      },
      {
        group: "Changelog",
        description: "Everything that changed in the product.",
        public: true,
        type: "changelog",
        updates: ["updates"],
      },
    ]);
  });

  test("accepts custom sidebar links alongside MDX page references", () => {
    const group = heyoDocs({
      content: "./content",
      groups: [
        {
          group: "Documentation",
          sections: [
            {
              section: "Start here",
              pages: [
                "getting-started",
                { title: "Admin panel", src: "https://app.example.com" },
              ],
            },
          ],
        },
      ],
    }).groups[0];

    expect(group?.type).toBe("documentation");
    expect(
      group?.type === "documentation" ? group.sections[0] : undefined,
    ).toEqual({
      section: "Start here",
      expanded: true,
      pages: [
        "getting-started",
        { title: "Admin panel", src: "https://app.example.com" },
      ],
    });
  });

  test("accepts a page list without a section heading or icon", () => {
    const group = heyoDocs({
      content: "./content",
      groups: [
        {
          group: "Documentation",
          sections: [{ pages: ["index", "quickstart"] }],
        },
      ],
    }).groups[0];

    expect(
      group?.type === "documentation" ? group.sections[0] : undefined,
    ).toEqual({
      expanded: true,
      pages: ["index", "quickstart"],
    });
  });

  test("accepts icon-bearing page references at every navigation depth", () => {
    const group = heyoDocs({
      content: "./content",
      groups: [
        {
          group: "Documentation",
          sections: [
            {
              pages: [
                { page: "introduction", icon: "book" },
                {
                  section: "Guides",
                  pages: [{ page: "guides/install", icon: "lightbulb" }],
                },
              ],
            },
          ],
        },
      ],
    }).groups[0];

    expect(
      group?.type === "documentation" ? group.sections[0] : undefined,
    ).toEqual({
      expanded: true,
      pages: [
        { page: "introduction", icon: "book" },
        {
          section: "Guides",
          expanded: true,
          pages: [{ page: "guides/install", icon: "lightbulb" }],
        },
      ],
    });
  });

  test("requires both page and icon for an icon-bearing page reference", () => {
    const invalidReferences = [
      { page: "introduction" },
      { icon: "book" },
      { page: "", icon: "book" },
      { page: "introduction", icon: "" },
      { page: "../outside", icon: "book" },
      { page: "introduction", icon: "book", unexpected: true },
    ];

    for (const reference of invalidReferences) {
      expect(() =>
        validateConfig({
          content: "./content",
          groups: [
            {
              group: "Documentation",
              sections: [{ pages: [reference] }],
            },
          ],
        } as never),
      ).toThrow();
    }
  });

  test("accepts an explicit documentation type", () => {
    expect(
      heyoDocs({
        content: "./content",
        groups: [{ group: "Documentation", type: "documentation" }],
      }).groups[0]?.type,
    ).toBe("documentation");
  });

  test("accepts an application-owned navigation element", () => {
    const navigation = createElement(
      "a",
      { href: "https://github.com/acme" },
      "GitHub",
    );

    expect(heyoDocs({ content: "./content", navigation }).navigation).toBe(
      navigation,
    );
  });

  test("rejects invalid config fields instead of ignoring them", () => {
    expect(() => validateConfig({ mode: "midnight" } as never)).toThrow();
    expect(() => validateConfig({ unexpected: true } as never)).toThrow();
    expect(() =>
      validateConfig({ content: "./content", buttons: [] } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        groups: [{ group: "API", type: "openapi", schema: "./openapi.json" }],
      } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Documentation",
            sections: [{ section: "Start", expanded: "yes" }],
          },
        ],
      } as never),
    ).toThrow();
  });

  test("requires changelog group names and accepts extension-free update references", () => {
    expect(() =>
      validateConfig({
        groups: [{ type: "changelog", updates: ["updates.mdx"] }],
      } as never),
    ).toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Updates",
            type: "changelog",
            updates: ["updates/march"],
          },
        ],
      }),
    ).not.toThrow();
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Updates",
            type: "changelog",
            updates: ["updates/march"],
          },
        ],
      }),
    ).not.toThrow();
  });
});

test("accepts recursively nested documentation sections", () => {
  const group = heyoDocs({
    content: "./content",
    groups: [
      {
        group: "Documentation",
        sections: [
          {
            section: "Guides",
            pages: [
              {
                section: "Advanced",
                expanded: false,
                pages: [
                  {
                    section: "Deployment",
                    pages: ["guides/deploy"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  }).groups[0];

  expect(
    group?.type === "documentation" ? group.sections[0] : undefined,
  ).toEqual({
    section: "Guides",
    expanded: true,
    pages: [
      {
        section: "Advanced",
        expanded: false,
        pages: [
          {
            section: "Deployment",
            expanded: true,
            pages: ["guides/deploy"],
          },
        ],
      },
    ],
  });
});

test("validates nested section entries with the same rules as top-level pages", () => {
  const invalidNestedPages = [
    { schema: "./openapi.json" },
    { title: "Missing destination" },
    { section: "Missing pages", pages: "guides" },
    "../outside",
  ];

  for (const page of invalidNestedPages) {
    expect(() =>
      validateConfig({
        content: "./content",
        groups: [
          {
            group: "Documentation",
            sections: [
              {
                section: "Guides",
                pages: [{ section: "Nested", pages: [page] }],
              },
            ],
          },
        ],
      } as never),
    ).toThrow();
  }
});
