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

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

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
}: ThemeProviderProps) {
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
    const handleSystemThemeChange = () => {
      const nextTheme = getStoredTheme(storageKey, defaultTheme);
      setResolvedTheme(applyTheme(nextTheme));
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return;
      syncTheme();
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorage);
    setMounted(true);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [defaultTheme, storageKey]);

  const value = {
    theme,
    resolvedTheme,
    mounted,
    setTheme: (nextTheme: Theme) => {
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch {
        // The requested preference still applies when storage is unavailable.
      }

      setThemeState(nextTheme);
      setResolvedTheme(applyTheme(nextTheme));
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
}
