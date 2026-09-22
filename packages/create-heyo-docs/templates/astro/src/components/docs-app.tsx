import { DocsApp } from "@heyo-sh/heyo-docs";
import type { DocsLinkProps } from "@heyo-sh/heyo-docs/link";
import type { OpenApiEndpoint } from "@heyo-sh/heyo-docs/types";
import { DEFAULT_THEME_STORAGE_KEY } from "@heyo-sh/heyo-docs/theme/script";
import { ThemeProvider, useDocsTheme } from "@heyo-sh/heyo-docs/theme/provider";
import { forwardRef } from "react";
import { __HEYO_THEME_IDENTIFIER__ } from "@heyo-sh/heyo-docs/theme/__HEYO_THEME__";

import { iconSet } from "../heyo-docs-icons";
import { config } from "virtual:heyo-docs-config";
import { openApiEndpoints } from "virtual:heyo-docs-openapi/index";
import { pages } from "virtual:heyo-docs-content";

// Astro uses ordinary document navigation for docs links. It preserves static
// page HTML and metadata instead of maintaining a second router in React.
const AstroLink = forwardRef<HTMLAnchorElement, DocsLinkProps>(
  function AstroLink(props, ref) {
    return <a {...props} ref={ref} />;
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
    <ThemeProvider
      defaultTheme={config.mode}
      storageKey={DEFAULT_THEME_STORAGE_KEY}
    >
      <DocsShell
        currentOpenApiEndpoint={currentOpenApiEndpoint}
        pathname={pathname}
      />
    </ThemeProvider>
  );
}

function DocsShell({
  currentOpenApiEndpoint,
  pathname,
}: {
  currentOpenApiEndpoint?: OpenApiEndpoint;
  pathname: string;
}) {
  const { mounted, resolvedTheme, toggleTheme } = useDocsTheme();
  return (
    <DocsApp
      config={config}
      currentOpenApiEndpoint={currentOpenApiEndpoint}
      iconSet={iconSet}
      isDark={mounted ? resolvedTheme === "dark" : undefined}
      link={AstroLink}
      onThemeToggle={mounted ? toggleTheme : undefined}
      openApiEndpoints={openApiEndpoints}
      openApiRequestUrl="/heyo-docs-internal/openapi-request"
      pages={pages}
      pathname={pathname}
      theme={__HEYO_THEME_IDENTIFIER__}
    />
  );
}
