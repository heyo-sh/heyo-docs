import {
  navigationGroupContainsPath,
  navigationPages,
  navigationSectionPathForPath,
} from "../navigation";
import type {
  ChangelogGroupConfig,
  DocsPage,
  HeyoDocsConfig,
  NavigationGroup,
  OpenApiEndpoint,
} from "../types";

export interface DocsSeoInput {
  config: HeyoDocsConfig;
  pathname: string;
  page?: DocsPage;
  endpoint?: OpenApiEndpoint;
  changelogGroup?: ChangelogGroupConfig;
  navigation?: NavigationGroup[];
}

export interface DocsSeoMetadata {
  title: string;
  description: string;
  canonical?: string;
  structuredData: unknown[];
}

/** Framework-neutral site metadata and WebSite JSON-LD. */
export function siteSeo(config: HeyoDocsConfig): DocsSeoMetadata {
  return {
    title: config.title,
    description: config.description,
    canonical: config.siteUrl ? `${config.siteUrl}/` : undefined,
    structuredData: [
      {
        "@context": "https://schema.org",
        ...website(config),
        description: config.description,
      },
    ],
  };
}

/** Framework-neutral page metadata and JSON-LD for docs, changelog and API pages. */
export function docsSeo(input: DocsSeoInput): DocsSeoMetadata {
  const { changelogGroup, config, endpoint, navigation, page, pathname } =
    input;
  const title = page?.seo.title ?? `${endpoint!.title} | ${config.title}`;
  const description =
    page?.seo.description ??
    endpoint?.description ??
    `${endpoint!.method.toUpperCase()} ${endpoint!.path} API endpoint.`;
  const canonical =
    page?.seo.canonical ??
    (config.siteUrl ? `${config.siteUrl}${pathname}` : undefined);
  const currentTitle = page?.title ?? endpoint!.title;
  const crumbs = breadcrumbItems(
    navigation,
    pathname,
    currentTitle,
    changelogGroup,
  );

  return {
    title,
    description,
    canonical,
    structuredData: [
      structuredPageData({
        changelogGroup,
        config,
        endpoint,
        page,
        canonical,
        description,
        title,
      }),
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { label: config.title, href: config.siteUrl },
          ...crumbs,
        ].map((item, index, allItems) => {
          const url =
            index === allItems.length - 1
              ? canonical
              : absoluteUrl(config.siteUrl, item.href);
          return {
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(url ? { item: url } : {}),
          };
        }),
      },
    ],
  };
}

/** Safely serialises automatic JSON-LD for framework script elements. */
export function serializeJsonLd(structuredData: unknown): string {
  return JSON.stringify(structuredData).replace(/</g, "\\u003c");
}

/** Includes generated API endpoint URLs as well as ordinary MDX pages. */
export function sitemapPaths(model: {
  pages: Array<Pick<DocsPage, "slug">>;
  endpoints: Array<Pick<OpenApiEndpoint, "slug">>;
}) {
  return [...model.pages, ...model.endpoints].map((page) => page.slug);
}

export function seoForPage(
  config: Pick<HeyoDocsConfig, "title" | "description" | "siteUrl">,
  page: Pick<DocsPage["seo"], "title" | "description"> & { slug: string },
): DocsPage["seo"] {
  return {
    title: `${page.title} | ${config.title}`,
    description: page.description || config.description,
    canonical: config.siteUrl
      ? `${config.siteUrl}${page.slug === "/" ? "/" : page.slug}`
      : undefined,
  };
}

export function sitemapXml(siteUrl: string, paths: string[]): string {
  const base = siteUrl.replace(/\/$/, "");
  const urls = paths
    .map(
      (path) =>
        `  <url><loc>${escapeXml(`${base}${path === "/" ? "/" : path}`)}</loc></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function website(config: HeyoDocsConfig) {
  return {
    "@type": "WebSite",
    name: config.title,
    ...(config.siteUrl ? { url: config.siteUrl } : {}),
  };
}

function breadcrumbItems(
  navigation: NavigationGroup[] | undefined,
  pathname: string,
  title: string,
  changelogGroup: ChangelogGroupConfig | undefined,
): Array<{ label: string; href?: string }> {
  if (changelogGroup) return [{ label: changelogGroup.group, href: pathname }];
  const group = navigation?.find((candidate) =>
    navigationGroupContainsPath(candidate, pathname),
  );
  if (!group) return [{ label: title, href: pathname }];
  const sections = navigationSectionPathForPath(group.sections, pathname) ?? [];
  return [
    { label: group.group, href: navigationPages(group.sections)[0]?.slug },
    ...sections
      .filter((section) => section.section)
      .map((section) => ({
        label: section.section!,
        href: navigationPages([section])[0]?.slug,
      })),
    { label: title, href: pathname },
  ];
}

function absoluteUrl(siteUrl: string | undefined, href: string | undefined) {
  if (!siteUrl || !href) return undefined;
  return /^https?:\/\//.test(href)
    ? href
    : new URL(href, `${siteUrl}/`).toString();
}

function structuredPageData({
  changelogGroup,
  config,
  endpoint,
  page,
  canonical,
  description,
  title,
}: Omit<DocsSeoInput, "pathname" | "navigation"> & {
  canonical?: string;
  description: string;
  title: string;
}) {
  if (endpoint) {
    return {
      "@context": "https://schema.org",
      "@type": "APIReference",
      headline: title,
      description,
      ...(canonical ? { url: canonical } : {}),
      isPartOf: website(config),
      mainEntity: {
        "@type": "EntryPoint",
        name:
          endpoint.operationId ??
          `${endpoint.method.toUpperCase()} ${endpoint.path}`,
        httpMethod: endpoint.method.toUpperCase(),
        urlTemplate: endpoint.servers[0]
          ? `${endpoint.servers[0].replace(/\/$/, "")}${endpoint.path}`
          : endpoint.path,
        ...(endpoint.requestBody?.contentType
          ? { encodingType: endpoint.requestBody.contentType }
          : {}),
        ...(endpoint.responses[0]?.contentType
          ? { contentType: endpoint.responses[0].contentType }
          : {}),
      },
    };
  }

  if (page && changelogGroup) {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      headline: title,
      description,
      ...(canonical ? { url: canonical } : {}),
      isPartOf: website(config),
      ...(page.changelogUpdates?.length
        ? {
            hasPart: page.changelogUpdates.map((update) => ({
              "@type": "TechArticle",
              headline: update.label,
              ...(update.tags.length
                ? { keywords: update.tags.join(", ") }
                : {}),
              ...(canonical ? { url: `${canonical}#${update.id}` } : {}),
            })),
          }
        : {}),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    ...(canonical ? { url: canonical } : {}),
    isPartOf: website(config),
  };
}

function escapeXml(value: string): string {
  return value.replace(
    /[<>&'\"]/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[character]!,
  );
}
