export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = Exclude<Theme, "system">;

export const DEFAULT_THEME: Theme = "system";
export const THEME_STORAGE_KEY = "heyo-docs-theme";

const themeValues = new Set<Theme>(["light", "dark", "system"]);

export function isTheme(value: string | null): value is Theme {
  return value !== null && themeValues.has(value as Theme);
}

export function getStoredTheme(
  storageKey: string,
  fallbackTheme: Theme,
): Theme {
  if (typeof window === "undefined") return fallbackTheme;

  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    return isTheme(storedTheme) ? storedTheme : fallbackTheme;
  } catch {
    return fallbackTheme;
  }
}

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyTheme(theme: Theme): ResolvedTheme {
  const resolvedTheme = resolveTheme(theme);
  const root = window.document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;

  return resolvedTheme;
}

export function getThemeScript(storageKey: string, defaultTheme: Theme) {
  return `(() => {
  const storageKey = ${JSON.stringify(storageKey)};
  const fallbackTheme = ${JSON.stringify(defaultTheme)};
  const isTheme = (value) => value === "light" || value === "dark" || value === "system";

  const storedTheme = (() => {
    try {
      const value = window.localStorage.getItem(storageKey);
      return isTheme(value) ? value : fallbackTheme;
    } catch {
      return fallbackTheme;
    }
  })();

  const resolvedTheme = storedTheme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : storedTheme;

  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
})();`;
}
