import { DocsApp } from "@heyo-sh/heyo-docs";
import {
  createDocsModel,
  findDocsPage,
  findOpenApiEndpoint,
} from "@heyo-sh/heyo-docs/model";
import { changelogGroupForPage } from "@heyo-sh/heyo-docs/navigation";
import {
  openApiEndpointDataPath,
  openApiEndpointDetail,
} from "@heyo-sh/heyo-docs/openapi";
import { docsSeoMeta } from "@heyo-sh/heyo-docs/seo/react-router";
import type { OpenApiEndpoint } from "@heyo-sh/heyo-docs/types";
import { useDocsTheme } from "@heyo-sh/heyo-docs/theme/provider";
import {
  Link,
  useLoaderData,
  useParams,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { grainTheme } from "@heyo-sh/heyo-docs/theme/grain";

import { iconSet } from "../heyo-docs-icons";
import { config } from "virtual:heyo-docs-config";
import { pages } from "virtual:heyo-docs-content";
import { openApiDocuments } from "virtual:heyo-docs-openapi";
import { openApiEndpoints } from "virtual:heyo-docs-openapi/index";

function pathnameFor(params: Record<string, string | undefined>): string {
  const path = params["*"]?.replace(/^\/+|\/+$/g, "");
  return path ? `/${path}` : "/";
}

const RouterLink = forwardRef<HTMLAnchorElement, ComponentPropsWithoutRef<"a">>(
  function RouterLink({ href = "/", ...props }, ref) {
    return <Link {...props} ref={ref} to={href} />;
  },
);

export async function loader({ params }: LoaderFunctionArgs) {
  const pathname = pathnameFor(params);
  const model = createDocsModel(config, pages, [], openApiEndpoints);
  const page = findDocsPage(model.pages, pathname);
  const endpoint = findOpenApiEndpoint(model.endpoints, pathname);
  if (!page && !endpoint) throw new Response("Not Found", { status: 404 });

  if (!endpoint) return {};

  // Prerendering serialises this operation-specific data with its static route,
  // so the browser's first paint already contains the complete API reference.
  if (typeof window === "undefined") {
    const serverModel = createDocsModel(config, pages, openApiDocuments);
    const currentOpenApiEndpoint = findOpenApiEndpoint(
      serverModel.endpoints,
      pathname,
    );
    return {
      currentOpenApiEndpoint: currentOpenApiEndpoint
        ? openApiEndpointDetail(currentOpenApiEndpoint)
        : undefined,
    };
  }

  // Client transitions wait for the static shard before committing the new
  // route. This prevents rendering the compact index and replacing it later.
  const response = await fetch(openApiEndpointDataPath(endpoint.slug));
  if (!response.ok)
    throw new Response("OpenAPI endpoint data could not be loaded", {
      status: response.status,
    });
  return {
    currentOpenApiEndpoint: (await response.json()) as OpenApiEndpoint,
  };
}

export const meta: MetaFunction = ({ params }) => {
  const model = createDocsModel(config, pages, [], openApiEndpoints);
  const pathname = pathnameFor(params);
  const page = findDocsPage(model.pages, pathname);
  const endpoint = findOpenApiEndpoint(model.endpoints, pathname);

  if (!page && !endpoint)
    return [
      { title: `Not found | ${config.title}` },
      { name: "robots", content: "noindex" },
    ];

  return docsSeoMeta({
    config,
    pathname,
    page,
    endpoint,
    navigation: model.navigation,
    changelogGroup: page
      ? changelogGroupForPage(config.groups, page, model.pages)
      : undefined,
  });
};

export default function DocsRoute() {
  const { currentOpenApiEndpoint } = useLoaderData<typeof loader>();
  return (
    <DocsShell
      currentOpenApiEndpoint={currentOpenApiEndpoint}
      pathname={pathnameFor(useParams())}
    />
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
      link={RouterLink}
      openApiEndpoints={openApiEndpoints}
      openApiRequestUrl="/heyo-docs-internal/openapi-request"
      pages={pages}
      pathname={pathname}
      theme={grainTheme}
      isDark={mounted ? resolvedTheme === "dark" : undefined}
      onThemeToggle={mounted ? toggleTheme : undefined}
    />
  );
}

export function ErrorBoundary() {
  return <DocsShell pathname="/__not-found" />;
}
