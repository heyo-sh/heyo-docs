import type { Metadata } from "next";
import {
  type ChangelogGroupConfig,
  type DocsPage,
  type HeyoDocsConfig,
  type NavigationGroup,
  type OpenApiEndpoint,
} from "@heyo-sh/heyo-docs";
import {
  navigationGroupContainsPath,
  navigationPages,
  navigationSectionPathForPath,
} from "@heyo-sh/heyo-docs/node";

interface DocsSeoInput {
  config: HeyoDocsConfig;
  pathname: string;
  page?: DocsPage;
  endpoint?: OpenApiEndpoint;
  changelogGroup?: ChangelogGroupConfig;
  navigation: NavigationGroup[];
}

function canonicalFor({ config, pathname, page }: DocsSeoInput) {
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

function breadcrumbItems({
  changelogGroup,
  navigation,
  pathname,
  title,
}: Pick<DocsSeoInput, "changelogGroup" | "navigation" | "pathname"> & {
  title: string;
}) {
  if (changelogGroup) return [{ label: changelogGroup.group, href: pathname }];
  const group = navigation.find((candidate) =>
    navigationGroupContainsPath(candidate, pathname),
  );
  const sections = group
    ? navigationSectionPathForPath(group.sections, pathname)
    : undefined;
  if (!group) return [{ label: title, href: pathname }];
  return [
    { label: group.group, href: navigationPages(group.sections)[0]?.slug },
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
  return /^https?:\/\//.test(href)
    ? href
    : new URL(href, `${siteUrl}/`).toString();
}

/** Next Metadata plus JSON-LD for MDX, changelog and generated API pages. */
export function docsSeo(input: DocsSeoInput): {
  metadata: Metadata;
  structuredData: unknown[];
} {
  const { changelogGroup, config, endpoint, navigation, page, pathname } =
    input;
  const title = page?.seo.title ?? `${endpoint!.title} | ${config.title}`;
  const description =
    page?.seo.description ??
    endpoint?.description ??
    `${endpoint!.method.toUpperCase()} ${endpoint!.path} API endpoint.`;
  const canonical = canonicalFor(input);
  const pageType = endpoint
    ? {
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
      }
    : changelogGroup
      ? {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          headline: title,
          description,
          ...(canonical ? { url: canonical } : {}),
          isPartOf: website(config),
          ...(page?.changelogUpdates?.length
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
        }
      : {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: title,
          description,
          ...(canonical ? { url: canonical } : {}),
          isPartOf: website(config),
        };
  const crumbs = breadcrumbItems({
    changelogGroup,
    navigation,
    pathname,
    title: page?.title ?? endpoint!.title,
  });
  const structuredData = [
    pageType,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { label: config.title, href: config.siteUrl },
        ...crumbs,
      ].map((item, index, items) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        ...((
          index === items.length - 1
            ? canonical
            : absoluteUrl(config.siteUrl, item.href)
        )
          ? {
              item:
                index === items.length - 1
                  ? canonical
                  : absoluteUrl(config.siteUrl, item.href),
            }
          : {}),
      })),
    },
  ];
  return {
    metadata: {
      title,
      description,
      robots: { index: true, follow: true },
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        type: "article",
        siteName: config.title,
        title,
        description,
        ...(canonical ? { url: canonical } : {}),
      },
      twitter: { card: "summary", title, description },
    },
    structuredData,
  };
}
