import type { DocsMode } from "../types";

export const DEFAULT_THEME_STORAGE_KEY = "heyo-docs-theme";

/** Inline before paint to avoid a light/dark flash during hydration. */
export function themeBootstrapScript(
  storageKey: string = DEFAULT_THEME_STORAGE_KEY,
  defaultTheme: DocsMode = "system",
): string {
  return `(() => {
  const storageKey = ${JSON.stringify(storageKey)};
  const fallbackTheme = ${JSON.stringify(defaultTheme)};
  const isTheme = (value) => value === "light" || value === "dark" || value === "system";
  const storedTheme = (() => {
    try {
      const value = window.localStorage.getItem(storageKey);
      return isTheme(value) ? value : fallbackTheme;
    } catch { return fallbackTheme; }
  })();
  const resolvedTheme = storedTheme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : storedTheme;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
})();`;
}
