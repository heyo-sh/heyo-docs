import {
  createDocsModel,
  DocsApp,
  changelogGroupForPage,
  findDocsPage,
  findOpenApiEndpoint,
  openApiEndpointDataPath,
  openApiEndpointDetail,
  type OpenApiEndpoint,
} from "@heyo-sh/heyo-docs";
import {
  Link,
  useLoaderData,
  useParams,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "react-router";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import config from "../../heyo-docs.config";
import { iconSet } from "../heyo-docs-icons";
import { useTheme } from "../components/theme-provider";
import { docsSeoMeta } from "../lib/seo";
import { pages } from "virtual:heyo-docs-content";
import { openApiDocuments } from "virtual:heyo-docs-openapi";
import { openApiEndpoints } from "virtual:heyo-docs-openapi/index";

const pathnameFor = (params: Record<string, string | undefined>) => {
  const path = params["*"]?.replace(/^\/+|\/+$/g, "");
  return path ? `/${path}` : "/";
};

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
      { title: "Not found | Heyo Docs example" },
      { name: "robots", content: "noindex" },
    ];
  return docsSeoMeta({
    changelogGroup: page
      ? changelogGroupForPage(config.groups, page, model.pages)
      : undefined,
    config,
    endpoint,
    navigation: model.navigation,
    page,
    pathname,
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
  const { mounted, resolvedTheme, setTheme } = useTheme();

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
      isDark={mounted ? resolvedTheme === "dark" : undefined}
      onThemeToggle={
        mounted
          ? () => setTheme(resolvedTheme === "dark" ? "light" : "dark")
          : undefined
      }
    />
  );
}
export function ErrorBoundary() {
  return <DocsShell pathname="/__not-found" />;
}
