"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  applyTheme,
  DEFAULT_THEME,
  getStoredTheme,
  type ResolvedTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "../lib/theme";

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  mounted: boolean;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined,
);

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_STORAGE_KEY,
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    defaultTheme === "system" ? "light" : defaultTheme,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const nextTheme = getStoredTheme(storageKey, defaultTheme);
      setThemeState(nextTheme);
      setResolvedTheme(applyTheme(nextTheme));
    };
    syncTheme();
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChange = () => syncTheme();
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === storageKey) syncTheme();
    };
    mediaQuery.addEventListener("change", onSystemThemeChange);
    window.addEventListener("storage", onStorage);
    setMounted(true);
    return () => {
      mediaQuery.removeEventListener("change", onSystemThemeChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [defaultTheme, storageKey]);

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        resolvedTheme,
        mounted,
        setTheme: (nextTheme) => {
          try {
            window.localStorage.setItem(storageKey, nextTheme);
          } catch {
            // The requested preference still applies when storage is unavailable.
          }
          setThemeState(nextTheme);
          setResolvedTheme(applyTheme(nextTheme));
        },
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
