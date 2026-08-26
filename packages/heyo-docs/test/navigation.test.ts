import { expect, test } from "bun:test";

import {
  adjacentPages,
  changelogGroupForPage,
  navigationGroupContainsPath,
  navigationFromGroups,
  navigationFromSlugs,
  navigationPages,
  navigationSectionPathForPath,
  validateGroupPageReferences,
} from "../src/navigation";

test("builds nested navigation from paths", () => {
  expect(
    navigationFromSlugs([
      { slug: "/guides/install", title: "Install" },
      { slug: "/", title: "Home" },
      { slug: "/guides/deploy", title: "Deploy" },
    ]),
  ).toEqual([
    { title: "Home", path: "/", children: [] },
    {
      title: "Guides",
      children: [
        { title: "Deploy", path: "/guides/deploy", children: [] },
        { title: "Install", path: "/guides/install", children: [] },
      ],
    },
  ]);
});

test("builds sidebar navigation from configured group and page order", () => {
  expect(
    navigationFromGroups(
      [
        {
          group: "Documentation",
          icon: "globe",
          public: true,
          type: "documentation",
          sections: [
            {
              section: "Start",
              expanded: false,
              pages: ["guides", "index"],
            },
          ],
        },
      ],
      [
        {
          slug: "/",
          sourcePath: "index.mdx",
          title: "Home",
        },
        {
          slug: "/guides/deploy",
          sourcePath: "guides/deploy.mdx",
          title: "Deploy",
        },
        {
          slug: "/guides/install",
          sourcePath: "guides/install.mdx",
          title: "Install",
        },
      ],
    ),
  ).toEqual([
    {
      group: "Documentation",
      icon: "globe",
      public: true,
      sections: [
        {
          section: "Start",
          expanded: false,
          pages: [
            { slug: "/guides/deploy", title: "Deploy" },
            { slug: "/guides/install", title: "Install" },
            { slug: "/", title: "Home" },
          ],
        },
      ],
    },
  ]);
});

test("builds an unsectioned page list without adding it to the page ancestry", () => {
  const navigation = navigationFromGroups(
    [
      {
        group: "Documentation",
        public: true,
        type: "documentation" as const,
        sections: [{ expanded: true, pages: ["index", "quickstart"] }],
      },
    ],
    [
      { slug: "/", sourcePath: "index.mdx", title: "Home" },
      {
        slug: "/quickstart",
        sourcePath: "quickstart.mdx",
        title: "Quickstart",
      },
    ],
  );

  expect(navigation[0]?.sections).toEqual([
    {
      expanded: true,
      pages: [
        { slug: "/", title: "Home" },
        { slug: "/quickstart", title: "Quickstart" },
      ],
    },
  ]);
  expect(
    navigationSectionPathForPath(navigation[0]?.sections ?? [], "/quickstart"),
  ).toEqual([]);
  expect(adjacentPages(navigation, "/")).toEqual({
    next: { href: "/quickstart", title: "Quickstart" },
  });
});

test("keeps icons on configured page references in their resolved order", () => {
  const navigation = navigationFromGroups(
    [
      {
        group: "Documentation",
        public: true,
        type: "documentation" as const,
        sections: [
          {
            section: "Start",
            expanded: true,
            pages: [
              "introduction",
              { page: "quickstart", icon: "lightbulb" },
              { page: "guides/", icon: "folder" },
            ],
          },
        ],
      },
    ],
    [
      {
        slug: "/introduction",
        sourcePath: "introduction.mdx",
        title: "Introduction",
      },
      {
        slug: "/quickstart",
        sourcePath: "quickstart.mdx",
        title: "Quickstart",
      },
      {
        slug: "/guides/install",
        sourcePath: "guides/install.mdx",
        title: "Install",
      },
      {
        slug: "/guides/deploy",
        sourcePath: "guides/deploy.mdx",
        title: "Deploy",
      },
    ],
  );

  expect(navigation[0]?.sections[0]?.pages).toEqual([
    { slug: "/introduction", title: "Introduction" },
    { slug: "/quickstart", title: "Quickstart", icon: "lightbulb" },
    { slug: "/guides/install", title: "Install", icon: "folder" },
    { slug: "/guides/deploy", title: "Deploy", icon: "folder" },
  ]);
  expect(adjacentPages(navigation, "/quickstart")).toEqual({
    previous: { href: "/introduction", title: "Introduction" },
    next: { href: "/guides/install", title: "Install" },
  });
});

test("uses the first configured reference when an icon-bearing page is duplicated", () => {
  const navigation = navigationFromGroups(
    [
      {
        group: "Documentation",
        public: true,
        type: "documentation" as const,
        sections: [
          {
            section: "Start",
            expanded: true,
            pages: ["introduction", { page: "introduction", icon: "book" }],
          },
        ],
      },
    ],
    [
      {
        slug: "/introduction",
        sourcePath: "introduction.mdx",
        title: "Introduction",
      },
    ],
  );

  expect(navigation[0]?.sections[0]?.pages).toEqual([
    { slug: "/introduction", title: "Introduction" },
  ]);
});

test("validates icon-bearing page references like ordinary page references", () => {
  const groups = [
    {
      group: "Documentation",
      public: true,
      type: "documentation" as const,
      sections: [
        {
          section: "Start",
          expanded: true,
          pages: [{ page: "missing", icon: "book" }],
        },
      ],
    },
  ];

  expect(() => validateGroupPageReferences(groups, [])).toThrow(
    'could not resolve "missing" in group "Documentation", section "Start"',
  );
});

test("resolves extension-free references as files before directories", () => {
  const documentation = {
    group: "Documentation",
    public: true,
    type: "documentation" as const,
    sections: [{ section: "Guides", expanded: true, pages: ["guides"] }],
  };
  const changelog = {
    group: "Updates",
    public: true,
    type: "changelog" as const,
    updates: ["releases"],
  };
  const pages = [
    { slug: "/guides", sourcePath: "guides.mdx", title: "Guide index" },
    {
      slug: "/guides/first",
      sourcePath: "guides/first.mdx",
      title: "First guide",
    },
    {
      slug: "/releases",
      sourcePath: "releases.mdx",
      title: "Release overview",
    },
    {
      slug: "/releases/march",
      sourcePath: "releases/march.mdx",
      title: "March",
    },
  ];

  expect(
    navigationFromGroups([documentation], pages)[0]?.sections[0]?.pages,
  ).toEqual([{ slug: "/guides", title: "Guide index" }]);
  expect(
    navigationFromGroups(
      [
        {
          ...documentation,
          sections: [{ ...documentation.sections[0]!, pages: ["guides/"] }],
        },
      ],
      pages,
    )[0]?.sections[0]?.pages,
  ).toEqual([{ slug: "/guides/first", title: "First guide" }]);
  expect(
    navigationFromGroups([changelog], pages)[0]?.sections[0]?.pages,
  ).toEqual([{ slug: "/releases", title: "Release overview" }]);
  expect(changelogGroupForPage([changelog], pages[2]!, pages)?.group).toBe(
    "Updates",
  );
  expect(changelogGroupForPage([changelog], pages[3]!, pages)).toBeUndefined();
  expect(() =>
    validateGroupPageReferences([documentation, changelog], pages),
  ).not.toThrow();
});

test("builds, validates, and orders recursively nested navigation sections", () => {
  const groups = [
    {
      group: "Documentation",
      public: true,
      type: "documentation" as const,
      sections: [
        {
          section: "Guides",
          expanded: true,
          pages: [
            "guides/intro",
            {
              section: "Advanced",
              expanded: false,
              pages: [
                "guides/install",
                {
                  section: "Deployment",
                  expanded: true,
                  pages: ["guides/deploy"],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
  const pages = [
    {
      slug: "/guides/intro",
      sourcePath: "guides/intro.mdx",
      title: "Introduction",
    },
    {
      slug: "/guides/install",
      sourcePath: "guides/install.mdx",
      title: "Installation",
    },
    {
      slug: "/guides/deploy",
      sourcePath: "guides/deploy.mdx",
      title: "Deployment",
    },
  ];
  const navigation = navigationFromGroups(groups, pages);

  expect(navigation[0]?.sections[0]?.pages).toEqual([
    { slug: "/guides/intro", title: "Introduction" },
    {
      section: "Advanced",
      expanded: false,
      pages: [
        { slug: "/guides/install", title: "Installation" },
        {
          section: "Deployment",
          expanded: true,
          pages: [{ slug: "/guides/deploy", title: "Deployment" }],
        },
      ],
    },
  ]);
  expect(adjacentPages(navigation, "/guides/install")).toEqual({
    previous: { href: "/guides/intro", title: "Introduction" },
    next: { href: "/guides/deploy", title: "Deployment" },
  });
  expect(() => validateGroupPageReferences(groups, pages)).not.toThrow();
  expect(() =>
    validateGroupPageReferences(
      [
        {
          ...groups[0]!,
          sections: [
            {
              section: "Guides",
              expanded: true,
              pages: [
                {
                  section: "Advanced",
                  expanded: true,
                  pages: ["missing"],
                },
              ],
            },
          ],
        },
      ],
      pages,
    ),
  ).toThrow(
    'could not resolve "missing" in group "Documentation", section "Guides", section "Advanced"',
  );
});

test("supports every page reference form inside a nested section", () => {
  const groups = [
    {
      group: "Documentation",
      public: true,
      type: "documentation" as const,
      sections: [
        {
          section: "Start",
          expanded: true,
          pages: [
            "index",
            {
              section: "Guides",
              icon: "folder",
              expanded: true,
              pages: [
                { title: "Admin panel", src: "https://app.example.com" },
                "guides",
                { section: "Empty", expanded: false, pages: [] },
              ],
            },
            "after",
          ],
        },
      ],
    },
  ];
  const pages = [
    { slug: "/", sourcePath: "index.mdx", title: "Home" },
    {
      slug: "/guides/first",
      sourcePath: "guides/first.mdx",
      title: "First guide",
    },
    {
      slug: "/guides/second",
      sourcePath: "guides/second.mdx",
      title: "Second guide",
    },
    { slug: "/after", sourcePath: "after.mdx", title: "Afterword" },
  ];
  const navigation = navigationFromGroups(groups, pages);
  const topSection = navigation[0]?.sections[0];

  expect(topSection?.pages).toEqual([
    { slug: "/", title: "Home" },
    {
      section: "Guides",
      icon: "folder",
      expanded: true,
      pages: [
        { slug: "https://app.example.com", title: "Admin panel", link: true },
        { slug: "/guides/first", title: "First guide" },
        { slug: "/guides/second", title: "Second guide" },
        { section: "Empty", expanded: false, pages: [] },
      ],
    },
    { slug: "/after", title: "Afterword" },
  ]);
  expect(navigationPages(navigation[0]?.sections ?? [])).toEqual([
    { slug: "/", title: "Home" },
    { slug: "https://app.example.com", title: "Admin panel", link: true },
    { slug: "/guides/first", title: "First guide" },
    { slug: "/guides/second", title: "Second guide" },
    { slug: "/after", title: "Afterword" },
  ]);
  expect(adjacentPages(navigation, "/guides/first")).toEqual({
    previous: { href: "/", title: "Home" },
    next: { href: "/guides/second", title: "Second guide" },
  });
  expect(adjacentPages(navigation, "/guides/second")).toEqual({
    previous: { href: "/guides/first", title: "First guide" },
    next: { href: "/after", title: "Afterword" },
  });
  expect(navigationGroupContainsPath(navigation[0]!, "/guides/second")).toBe(
    true,
  );
  expect(
    navigationSectionPathForPath(
      navigation[0]?.sections ?? [],
      "/guides/second",
    )?.map((section) => section.section),
  ).toEqual(["Start", "Guides"]);
  expect(() => validateGroupPageReferences(groups, pages)).not.toThrow();
});

test("fails clearly when a configured page or directory does not exist", () => {
  expect(() =>
    validateGroupPageReferences(
      [
        {
          group: "Documentation",
          public: true,
          type: "documentation",
          sections: [{ section: "Start", expanded: true, pages: ["missing"] }],
        },
      ],
      [{ slug: "/", sourcePath: "index.mdx", title: "Home" }],
    ),
  ).toThrow('could not resolve "missing"');
});

test("includes configured links without requiring a matching MDX page", () => {
  const navigation = navigationFromGroups(
    [
      {
        group: "Documentation",
        public: true,
        type: "documentation" as const,
        sections: [
          {
            section: "Start",
            expanded: true,
            pages: [
              { title: "Admin panel", src: "https://app.example.com" },
              "index",
            ],
          },
        ],
      },
    ],
    [{ slug: "/", sourcePath: "index.mdx", title: "Home" }],
  );

  expect(navigation[0]?.sections[0]?.pages).toEqual([
    { slug: "https://app.example.com", title: "Admin panel", link: true },
    { slug: "/", title: "Home" },
  ]);
  expect(() =>
    validateGroupPageReferences(
      [
        {
          group: "Documentation",
          public: true,
          type: "documentation",
          sections: [
            {
              section: "Start",
              expanded: true,
              pages: [{ title: "Admin panel", src: "https://app.example.com" }],
            },
          ],
        },
      ],
      [],
    ),
  ).not.toThrow();
  expect(adjacentPages(navigation, "/")).toEqual({});
});

test("includes changelog pages in navigation and recognises their configured group", () => {
  const groups = [
    {
      group: "Changelog",
      public: true,
      type: "changelog" as const,
      updates: ["changelog"],
    },
  ];
  const page = {
    slug: "/changelog",
    sourcePath: "changelog.mdx",
    title: "Product updates",
  };

  expect(navigationFromGroups(groups, [page])).toEqual([
    {
      group: "Changelog",
      icon: "changelog",
      public: true,
      sections: [
        {
          section: "Updates",
          icon: "changelog",
          expanded: true,
          pages: [{ slug: "/changelog", title: "Product updates" }],
        },
      ],
    },
  ]);
  expect(changelogGroupForPage(groups, page, [page])?.group).toBe("Changelog");
});

test("resolves extension-free changelog files and reports missing paths clearly", () => {
  const pages = [
    {
      slug: "/updates/march",
      sourcePath: "updates/march.mdx",
      title: "March",
    },
    {
      slug: "/changelog",
      sourcePath: "changelog.mdx",
      title: "Changelog",
    },
  ];
  const groups = [
    {
      group: "Updates",
      public: true,
      type: "changelog" as const,
      updates: ["updates", "changelog"],
    },
  ];

  expect(navigationFromGroups(groups, pages)[0]?.sections[0]?.pages).toEqual([
    { slug: "/updates/march", title: "March" },
    { slug: "/changelog", title: "Changelog" },
  ]);
  expect(changelogGroupForPage(groups, pages[1]!, pages)).toBeDefined();
  expect(() =>
    validateGroupPageReferences(
      [
        {
          group: "Updates",
          public: true,
          type: "changelog",
          updates: ["missing"],
        },
      ],
      pages,
    ),
  ).toThrow(
    'could not resolve changelog reference "missing" in changelog group "Updates"',
  );
});
