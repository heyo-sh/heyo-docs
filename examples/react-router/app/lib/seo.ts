import type {
  ChangelogGroupConfig,
  DocsPage,
  HeyoDocsConfig,
  NavigationGroup,
  OpenApiEndpoint,
} from "@heyo-sh/heyo-docs";
import {
  navigationGroupContainsPath,
  navigationPages,
  navigationSectionPathForPath,
} from "@heyo-sh/heyo-docs";

interface DocsSeoMetaInput {
  config: HeyoDocsConfig;
  pathname: string;
  page?: DocsPage;
  endpoint?: OpenApiEndpoint;
  changelogGroup?: ChangelogGroupConfig;
  navigation?: NavigationGroup[];
}

function canonicalFor(
  config: HeyoDocsConfig,
  pathname: string,
  page?: DocsPage,
): string | undefined {
  return (
    page?.seo.canonical ??
    (config.siteUrl ? `${config.siteUrl}${pathname}` : undefined)
  );
}

function website(config: HeyoDocsConfig) {
  return {
    "@type": "WebSite",
    name: config.title,
    ...(config.siteUrl ? { url: config.siteUrl } : {}),
  };
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function breadcrumbItems(
  navigation: NavigationGroup[] | undefined,
  pathname: string,
  title: string,
  changelogGroup: ChangelogGroupConfig | undefined,
): BreadcrumbItem[] {
  if (changelogGroup) return [{ label: changelogGroup.group, href: pathname }];

  const group = navigation?.find((candidate) =>
    navigationGroupContainsPath(candidate, pathname),
  );
  const sections = group
    ? navigationSectionPathForPath(group.sections, pathname)
    : undefined;

  if (!group) return [{ label: title, href: pathname }];

  const groupHref = navigationPages(group.sections)[0]?.slug;
  return [
    { label: group.group, href: groupHref },
    ...(sections ?? []).flatMap((section) =>
      section.section
        ? [
            {
              label: section.section,
              href: navigationPages([section])[0]?.slug,
            },
          ]
        : [],
    ),
    { label: title, href: pathname },
  ];
}

function absoluteUrl(siteUrl: string | undefined, href: string | undefined) {
  if (!siteUrl || !href) return undefined;
  if (/^https?:\/\//.test(href)) return href;
  return new URL(href, `${siteUrl}/`).toString();
}

function breadcrumbs(
  config: HeyoDocsConfig,
  canonical: string | undefined,
  title: string,
  navigation: NavigationGroup[] | undefined,
  pathname: string,
  changelogGroup: ChangelogGroupConfig | undefined,
) {
  const items = breadcrumbItems(navigation, pathname, title, changelogGroup);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { label: config.title, href: config.siteUrl },
      ...items,
    ].map((item, index, allItems) => {
      const itemUrl =
        index === allItems.length - 1
          ? canonical
          : absoluteUrl(config.siteUrl, item.href);
      return {
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        ...(itemUrl ? { item: itemUrl } : {}),
      };
    }),
  };
}

function endpointUrlTemplate(endpoint: OpenApiEndpoint) {
  const server = endpoint.servers[0]?.replace(/\/$/, "");
  return server ? `${server}${endpoint.path}` : endpoint.path;
}

function structuredData({
  changelogGroup,
  config,
  endpoint,
  page,
  canonical,
  description,
  title,
}: Omit<DocsSeoMetaInput, "pathname"> & {
  canonical?: string;
  description: string;
  title: string;
}) {
  if (endpoint) {
    const entryPoint = {
      "@type": "EntryPoint",
      name:
        endpoint.operationId ??
        `${endpoint.method.toUpperCase()} ${endpoint.path}`,
      httpMethod: endpoint.method.toUpperCase(),
      urlTemplate: endpointUrlTemplate(endpoint),
      ...(endpoint.requestBody?.contentType
        ? { encodingType: endpoint.requestBody.contentType }
        : {}),
      ...(endpoint.responses[0]?.contentType
        ? { contentType: endpoint.responses[0].contentType }
        : {}),
    };
    return {
      "@context": "https://schema.org",
      "@type": "APIReference",
      headline: title,
      description,
      ...(canonical ? { url: canonical } : {}),
      isPartOf: website(config),
      mainEntity: entryPoint,
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

/** Metadata for regular docs, generated API endpoints, and changelog pages. */
export function docsSeoMeta({
  changelogGroup,
  config,
  endpoint,
  navigation,
  page,
  pathname,
}: DocsSeoMetaInput) {
  const title = page?.seo.title ?? `${endpoint!.title} | ${config.title}`;
  const description =
    page?.seo.description ??
    endpoint?.description ??
    `${endpoint!.method.toUpperCase()} ${endpoint!.path} API endpoint.`;
  const canonical = canonicalFor(config, pathname, page);

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
        structuredData({
          changelogGroup,
          config,
          endpoint,
          page,
          canonical,
          description,
          title,
        }),
        breadcrumbs(
          config,
          canonical,
          page?.title ?? endpoint!.title,
          navigation,
          pathname,
          changelogGroup,
        ),
      ],
    },
  ];
}

/** Includes generated API endpoint URLs as well as ordinary MDX pages. */
export function sitemapPaths(model: {
  pages: Array<Pick<DocsPage, "slug">>;
  endpoints: Array<Pick<OpenApiEndpoint, "slug">>;
}) {
  return [...model.pages, ...model.endpoints].map((page) => page.slug);
}
