import { describe, expect, test } from "bun:test";

import {
  changelogEntriesFromMdx,
  changelogUpdatesFromMdx,
  pageFromSource,
  searchTextFromMdx,
  slugFromFilePath,
  tableOfContentsFromMdx,
} from "../src/content";

describe("content paths", () => {
  test("generates clean documentation slugs", () => {
    expect(slugFromFilePath("index.mdx")).toBe("/");
    expect(slugFromFilePath("guides/index.mdx")).toBe("/guides");
    expect(slugFromFilePath("API/Auth Tokens.mdx")).toBe("/api/auth-tokens");
  });

  test("uses frontmatter and headings to create a page model", () => {
    const page = pageFromSource(
      "guides/install.mdx",
      "---\ntitle: Install\ndescription: Set it up\n---\n# Install\n\n## First step\n\n### Detail",
    );
    expect(page).toMatchObject({
      slug: "/guides/install",
      title: "Install",
      description: "Set it up",
    });
    expect(page.tableOfContents).toEqual([
      { id: "first-step", title: "First step", depth: 2 },
      { id: "detail", title: "Detail", depth: 3 },
    ]);
    expect(
      tableOfContentsFromMdx(
        "# Title\n```mdx\n## Not a heading\n```\n## A heading",
      ),
    ).toEqual([{ id: "a-heading", title: "A heading", depth: 2 }]);
    expect(
      tableOfContentsFromMdx(
        "## React Router\n### Create a project\n### Manual setup\n## Next.js\n### Create a project\n### Manual setup",
      ),
    ).toEqual([
      { id: "react-router", title: "React Router", depth: 2 },
      { id: "create-a-project", title: "Create a project", depth: 3 },
      { id: "manual-setup", title: "Manual setup", depth: 3 },
      { id: "next-js", title: "Next.js", depth: 2 },
      { id: "create-a-project-1", title: "Create a project", depth: 3 },
      { id: "manual-setup-1", title: "Manual setup", depth: 3 },
    ]);
  });

  test("extracts readable text for local search", () => {
    expect(
      searchTextFromMdx(
        "---\ntitle: Hidden\n---\n# Install\n\nUse [the guide](/guide).\n\n```ts\nconst hidden = true;\n```",
      ),
    ).toBe("Install Use the guide.");
  });

  test("extracts changelog labels and tag filters from Update components", () => {
    const source = `---
title: Product updates
---

<Update label="March 2026" tags={["New releases", 'Bug fixes']}>
  ## Release notes
</Update>

<Update
  label="February 2026"
  tags={["Bug fixes"]}
>
  Fixed an issue.
</Update>

\`\`\`mdx
<Update label="Example only" />
\`\`\``;

    expect(changelogUpdatesFromMdx(source)).toEqual([
      {
        id: "march-2026",
        label: "March 2026",
        tags: ["New releases", "Bug fixes"],
      },
      {
        id: "february-2026",
        label: "February 2026",
        tags: ["Bug fixes"],
      },
    ]);
    expect(
      pageFromSource("changelog.mdx", source).changelogUpdates,
    ).toHaveLength(2);
  });

  test("extracts a dated changelog entry body for RSS", () => {
    expect(
      changelogEntriesFromMdx(
        `<Update label="March 2026" date="2026-03-01" tags={["New releases"]}>
## Highlights

Added RSS support.

\`\`\`mdx
Hidden example
\`\`\`
</Update>`,
      ),
    ).toEqual([
      {
        id: "march-2026",
        label: "March 2026",
        date: "2026-03-01",
        tags: ["New releases"],
        description: "Highlights Added RSS support.",
      },
    ]);
  });
});
