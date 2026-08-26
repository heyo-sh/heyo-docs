import { expect, test } from "bun:test";
import { createElement } from "react";

import { nextSearchResultIndex, searchPages } from "../src/search";
import type { DocsPage } from "../src/types";

const pages: DocsPage[] = [
  {
    slug: "/getting-started",
    title: "Getting started",
    description: "Create a documentation project.",
    content: () => createElement("p"),
    searchContent:
      "Install the command line tool and start the development server.",
    seo: {
      title: "Getting started",
      description: "Create a documentation project.",
    },
    tableOfContents: [{ depth: 2, id: "install", title: "Install" }],
  },
  {
    slug: "/configuration",
    title: "Configuration",
    description: "Configure navigation.",
    content: () => createElement("p"),
    seo: { title: "Configuration", description: "Configure navigation." },
    tableOfContents: [],
  },
];

test("searches local MDX content with ZBSearch", () => {
  expect(
    searchPages(pages, "development server").map((page) => page.slug),
  ).toEqual(["/getting-started"]);
});

test("tolerates a one-character typo", () => {
  expect(searchPages(pages, "configuratio").map((page) => page.slug)).toEqual([
    "/configuration",
  ]);
});

test("cycles through search results with the arrow keys", () => {
  expect(nextSearchResultIndex(-1, 3, "next")).toBe(0);
  expect(nextSearchResultIndex(0, 3, "previous")).toBe(2);
  expect(nextSearchResultIndex(2, 3, "next")).toBe(0);
  expect(nextSearchResultIndex(0, 0, "next")).toBe(-1);
});
