import { expect, test } from "bun:test";

import { resolveTheme } from "../src/theme";

test("selects the built-in grain theme", () => {
  const theme = resolveTheme("grain");
  expect(theme.name).toBe("grain");
  expect(Object.keys(theme.components)).toEqual([
    "Layout",
    "TopNavigation",
    "Breadcrumb",
    "Sidebar",
    "DocsPage",
    "ChangelogPage",
    "OpenApiPage",
    "TableOfContents",
    "Tabs",
    "Search",
    "SidebarFooter",
  ]);
});

test("selects the built-in shade theme", () => {
  const theme = resolveTheme("shade");
  expect(theme.name).toBe("shade");
  expect(Object.keys(theme.components)).toEqual([
    "Layout",
    "TopNavigation",
    "Breadcrumb",
    "Sidebar",
    "DocsPage",
    "ChangelogPage",
    "OpenApiPage",
    "TableOfContents",
    "Tabs",
    "Search",
    "SidebarFooter",
  ]);
});

test("selects the built-in moss theme", () => {
  const theme = resolveTheme("moss");
  expect(theme.name).toBe("moss");
  expect(Object.keys(theme.components)).toEqual([
    "Layout",
    "TopNavigation",
    "Breadcrumb",
    "Sidebar",
    "DocsPage",
    "ChangelogPage",
    "OpenApiPage",
    "TableOfContents",
    "Tabs",
    "Search",
    "SidebarFooter",
  ]);
});
