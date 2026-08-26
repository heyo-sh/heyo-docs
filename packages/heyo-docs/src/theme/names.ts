/**
 * The single source of truth for themes bundled with Heyo Docs.
 *
 * Add a name here and its implementation to `registry.ts` when introducing a
 * new built-in theme. Keeping this module dependency-free lets configuration
 * validation use the same list without loading React components.
 */
export const builtInThemeNames = ["grain", "shade", "moss"] as const;

export type BuiltInThemeName = (typeof builtInThemeNames)[number];
