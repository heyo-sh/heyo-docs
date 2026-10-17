import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { resolveTheme } from "../src/theme";
import { builtInThemeNames } from "../src/theme/names";

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

test("gives every theme's blank code lines a height of their own", () => {
  for (const name of builtInThemeNames) {
    const css = readFileSync(
      new URL(`../src/theme/${name}/global.css`, import.meta.url),
      "utf8",
    );
    const line = css.match(/\.heyo-docs-code \.shiki \.line \{[^}]*\}/)?.[0];

    expect(line).toContain("min-height: 1lh");
  }
});

test("selects the built-in heyo theme", () => {
  const theme = resolveTheme("heyo");
  expect(theme.name).toBe("heyo");
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
