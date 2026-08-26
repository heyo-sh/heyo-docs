import type { HeyoDocsTheme } from "../types";
import { grainTheme } from "./grain";
import { mossTheme } from "./moss";
import { shadeTheme } from "./shade";
import type { BuiltInThemeName } from "./names";

const builtInThemes = {
  grain: grainTheme,
  shade: shadeTheme,
  moss: mossTheme,
} satisfies Record<BuiltInThemeName, HeyoDocsTheme>;

/** Resolves a theme that is bundled with the installed Heyo Docs version. */
export function resolveTheme(theme: BuiltInThemeName): HeyoDocsTheme {
  return builtInThemes[theme];
}
