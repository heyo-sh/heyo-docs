"use client";

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

import { docsConfig, openApiEndpoints, pages } from "../_heyo-docs/content";
import config from "../../heyo-docs.config";
import { iconSet } from "../heyo-docs-icons";
import { useTheme } from "./theme-provider";

type Navigate = (href: string) => void;

const NextNavigationContext = createContext<Navigate | undefined>(undefined);

const NextDocsLink = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<"a">
>(function NextDocsLink({ href, onClick, target, ...props }, ref) {
  const navigate = useContext(NextNavigationContext);

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
    <a {...props} href={href} onClick={handleClick} ref={ref} target={target} />
  );
});

export function NextDocsApp({
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
      page?.seo.title ?? `${indexedEndpoint!.title} | ${docsConfig.title}`;
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
    <NextNavigationContext.Provider value={navigate}>
      <DocsApp
        config={{ ...docsConfig, navigation: config.navigation }}
        iconSet={iconSet}
        isDark={mounted ? resolvedTheme === "dark" : undefined}
        link={NextDocsLink}
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
    </NextNavigationContext.Provider>
  );
}
