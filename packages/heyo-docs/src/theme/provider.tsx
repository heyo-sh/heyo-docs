"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { DocsMode } from "../types";
import { DEFAULT_THEME_STORAGE_KEY } from "./script";

export { DEFAULT_THEME_STORAGE_KEY } from "./script";
export type ResolvedDocsTheme = Exclude<DocsMode, "system">;

interface ThemeContextValue {
  theme: DocsMode;
  resolvedTheme: ResolvedDocsTheme;
  mounted: boolean;
  setTheme(theme: DocsMode): void;
  toggleTheme(): void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(theme: DocsMode): ResolvedDocsTheme {
  return theme === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
    : theme;
}

function applyTheme(theme: DocsMode): ResolvedDocsTheme {
  const resolvedTheme = resolveTheme(theme);
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = DEFAULT_THEME_STORAGE_KEY,
}: {
  children: ReactNode;
  defaultTheme?: DocsMode;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<DocsMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] =
    useState<ResolvedDocsTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let storedTheme = defaultTheme;
    try {
      const value = window.localStorage.getItem(storageKey);
      if (value === "light" || value === "dark" || value === "system")
        storedTheme = value;
    } catch {
      // Storage may be disabled. The configured fallback remains usable.
    }
    setThemeState(storedTheme);
    setResolvedTheme(applyTheme(storedTheme));

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        const value = window.localStorage.getItem(storageKey);
        if (value === "system") setResolvedTheme(applyTheme("system"));
      } catch {
        if (storedTheme === "system") setResolvedTheme(applyTheme("system"));
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return;
      try {
        const value = window.localStorage.getItem(storageKey);
        if (value === "light" || value === "dark" || value === "system") {
          setThemeState(value);
          setResolvedTheme(applyTheme(value));
        }
      } catch {
        // Ignore unavailable storage in another tab too.
      }
    };
    query.addEventListener("change", onChange);
    window.addEventListener("storage", onStorage);
    setMounted(true);
    return () => {
      query.removeEventListener("change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [defaultTheme, storageKey]);

  const setTheme = useCallback(
    (nextTheme: DocsMode) => {
      setThemeState(nextTheme);
      setResolvedTheme(applyTheme(nextTheme));
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // Theme changes must work even when storage is unavailable.
      }
    },
    [storageKey],
  );
  const toggleTheme = useCallback(
    () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    [resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, mounted, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useDocsTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value)
    throw new Error(
      "useDocsTheme must be used inside a Heyo Docs ThemeProvider.",
    );
  return value;
}
