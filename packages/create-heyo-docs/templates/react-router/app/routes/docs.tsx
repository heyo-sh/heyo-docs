import {
  createDocsModel,
  DocsApp,
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
  const title = page?.seo.title ?? `${endpoint!.title} | ${config.title}`;
  const description =
    page?.seo.description ??
    endpoint?.description ??
    `${endpoint!.method.toUpperCase()} ${endpoint!.path} API endpoint.`;
  const canonical =
    page?.seo.canonical ??
    (config.siteUrl ? `${config.siteUrl}${pathname}` : undefined);
  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: "index, follow" },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: config.title },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(canonical
      ? [
          { property: "og:url", content: canonical },
          {
            tagName: "link" as const,
            rel: "canonical",
            href: canonical,
          },
        ]
      : []),
    {
      "script:ld+json": [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: config.title,
          description: config.description,
          ...(config.siteUrl ? { url: config.siteUrl } : {}),
        },
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: page?.title ?? endpoint!.title,
          description,
          ...(canonical ? { url: canonical } : {}),
          isPartOf: {
            "@type": "WebSite",
            name: config.title,
            ...(config.siteUrl ? { url: config.siteUrl } : {}),
          },
        },
      ],
    },
  ];
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
