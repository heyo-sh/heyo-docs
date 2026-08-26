import {
  DocsApp,
  openApiEndpointDataPath,
  type OpenApiEndpoint,
} from "@heyo-sh/heyo-docs";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from "react";

import config from "../../heyo-docs.config";
import { iconSet } from "../heyo-docs-icons";
import { THEME_STORAGE_KEY } from "../lib/theme";
import { openApiEndpoints } from "virtual:heyo-docs-openapi/index";
import { pages } from "virtual:heyo-docs-content";
import { ThemeProvider, useTheme } from "./theme-provider";

type Navigate = (href: string) => void;

const AstroNavigationContext = createContext<Navigate | undefined>(undefined);

const AstroLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a">>(
  function AstroLink({ href, onClick, target, ...props }, ref) {
    const navigate = useContext(AstroNavigationContext);

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (
        !navigate ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        target
      )
        return;

      event.preventDefault();
      navigate(href ?? "/");
    };

    return (
      <a
        {...props}
        href={href}
        onClick={handleClick}
        ref={ref}
        target={target}
      />
    );
  },
);

export function AstroDocsApp({
  currentOpenApiEndpoint,
  pathname,
}: {
  currentOpenApiEndpoint?: OpenApiEndpoint;
  pathname: string;
}) {
  return (
    <ThemeProvider defaultTheme={config.mode} storageKey={THEME_STORAGE_KEY}>
      <DocsShell
        currentOpenApiEndpoint={currentOpenApiEndpoint}
        pathname={pathname}
      />
    </ThemeProvider>
  );
}

/**
 * Content is imported in this island instead of crossing Astro's serialisation
 * boundary. MDX pages are React components and must stay module references.
 */
function DocsShell({
  currentOpenApiEndpoint,
  pathname,
}: {
  currentOpenApiEndpoint?: OpenApiEndpoint;
  pathname: string;
}) {
  const { mounted, resolvedTheme, setTheme } = useTheme();
  const [activePathname, setActivePathname] = useState(pathname);
  const [activeOpenApiEndpoint, setActiveOpenApiEndpoint] = useState(
    currentOpenApiEndpoint,
  );
  const navigationId = useRef(0);

  const navigate = useCallback(async (href: string, updateHistory = true) => {
    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin) {
      window.location.assign(href);
      return;
    }

    const nextPathname = destination.pathname;
    const indexedEndpoint = openApiEndpoints.find(
      (endpoint) => endpoint.slug === nextPathname,
    );
    const page = pages.find((candidate) => candidate.slug === nextPathname);
    if (!indexedEndpoint && !page) {
      window.location.assign(href);
      return;
    }

    const currentNavigation = ++navigationId.current;
    let endpoint: OpenApiEndpoint | undefined;
    if (indexedEndpoint) {
      const response = await fetch(
        openApiEndpointDataPath(indexedEndpoint.slug),
      );
      if (!response.ok) {
        window.location.assign(href);
        return;
      }
      endpoint = (await response.json()) as OpenApiEndpoint;
    }
    if (currentNavigation !== navigationId.current) return;

    if (updateHistory) window.history.pushState({}, "", destination);
    document.title =
      page?.seo.title ?? `${indexedEndpoint!.title} | ${config.title}`;
    setActiveOpenApiEndpoint(endpoint);
    setActivePathname(nextPathname);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      void navigate(window.location.href, false);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [navigate]);

  return (
    <AstroNavigationContext.Provider value={navigate}>
      <DocsApp
        config={config}
        iconSet={iconSet}
        isDark={mounted ? resolvedTheme === "dark" : undefined}
        link={AstroLink}
        onThemeToggle={
          mounted
            ? () => setTheme(resolvedTheme === "dark" ? "light" : "dark")
            : undefined
        }
        currentOpenApiEndpoint={activeOpenApiEndpoint}
        openApiEndpoints={openApiEndpoints}
        openApiRequestUrl="/heyo-docs-internal/openapi-request"
        pages={pages}
        pathname={activePathname}
      />
    </AstroNavigationContext.Provider>
  );
}
