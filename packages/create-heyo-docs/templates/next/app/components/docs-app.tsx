"use client";

import Link from "next/link";
import { DocsApp } from "@heyo-sh/heyo-docs";
import type { DocsLinkProps } from "@heyo-sh/heyo-docs/link";
import type { OpenApiEndpoint } from "@heyo-sh/heyo-docs/types";
import { useDocsTheme } from "@heyo-sh/heyo-docs/theme/provider";
import { forwardRef } from "react";
import { __HEYO_THEME_IDENTIFIER__ } from "@heyo-sh/heyo-docs/theme/__HEYO_THEME__";

import { docsConfig, openApiEndpoints, pages } from "../_heyo-docs/content";
import { iconSet } from "../heyo-docs-icons";

const NextDocsLink = forwardRef<HTMLAnchorElement, DocsLinkProps>(
  function NextDocsLink({ href = "/", ...props }, ref) {
    // Next owns history, RSC payloads, metadata and scroll restoration. Docs
    // links must not emulate routing with pushState in a client component.
    return <Link {...props} href={href} ref={ref} />;
  },
);

export function NextDocsApp({
  currentOpenApiEndpoint,
  pathname,
}: {
  currentOpenApiEndpoint?: OpenApiEndpoint;
  pathname: string;
}) {
  const { mounted, resolvedTheme, toggleTheme } = useDocsTheme();

  return (
    <DocsApp
      config={docsConfig}
      currentOpenApiEndpoint={currentOpenApiEndpoint}
      iconSet={iconSet}
      isDark={mounted ? resolvedTheme === "dark" : undefined}
      link={NextDocsLink}
      onThemeToggle={mounted ? toggleTheme : undefined}
      openApiEndpoints={openApiEndpoints}
      openApiRequestUrl="/heyo-docs-internal/openapi-request"
      pages={pages}
      pathname={pathname}
      theme={__HEYO_THEME_IDENTIFIER__}
    />
  );
}
