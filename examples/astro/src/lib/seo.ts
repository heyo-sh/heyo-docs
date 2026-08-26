import {
  navigationGroupContainsPath,
  navigationPages,
  navigationSectionPathForPath,
  type ChangelogGroupConfig,
  type DocsPage,
  type HeyoDocsConfig,
  type NavigationGroup,
  type OpenApiEndpoint,
} from "@heyo-sh/heyo-docs";

interface DocsSeoInput {
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
}: Omit<DocsSeoInput, "pathname"> & {
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

export function docsSeo(input: DocsSeoInput) {
  const { changelogGroup, config, endpoint, navigation, page, pathname } =
    input;
  const title = page?.seo.title ?? `${endpoint!.title} | ${config.title}`;
  const description =
    page?.seo.description ??
    endpoint?.description ??
    `${endpoint!.method.toUpperCase()} ${endpoint!.path} API endpoint.`;
  const canonical = canonicalFor(config, pathname, page);

  return {
    title,
    description,
    canonical,
    structuredData: [
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
  };
}
