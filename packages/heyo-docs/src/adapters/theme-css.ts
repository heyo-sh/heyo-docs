import { existsSync } from "node:fs";
import { resolve } from "node:path";

import type { BuiltInThemeName } from "../theme/names";

/**
 * Imports the selected package theme and explicitly gives Tailwind the host
 * application's source directories. The published theme stylesheet can only
 * discover Heyo Docs classes on its own; without these sources, utilities used
 * by the application's routes, components, and MDX are omitted from the final
 * stylesheet.
 */
export function themeStylesheet(
  theme: BuiltInThemeName,
  sourceDirectories: string[],
): string {
  const sources = [
    ...new Set(sourceDirectories.map((source) => resolve(source))),
  ].filter(existsSync);
  return [
    `@import "@heyo-sh/heyo-docs/theme/${theme}.css";`,
    ...sources.map((source) => `@source ${JSON.stringify(source)};`),
    "",
  ].join("\n");
}

/** Common source roots used by React Router, Astro, and Next.js projects. */
export function themeSourceDirectories(root: string, contentDirectory: string) {
  return [resolve(root, "app"), resolve(root, "src"), contentDirectory];
}
