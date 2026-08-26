import {
  adjacentPages,
  changelogGroupForPage,
  navigationGroupContainsPath,
  navigationFromGroups,
  navigationFromSlugs,
  navigationPages,
  navigationSectionPathForPath,
} from "./navigation";
import {
  createDocsModel,
  findDocsPage,
  findOpenApiEndpoint,
  normaliseDocsPathname,
} from "./model";
import { resolveTheme } from "./theme";
import { IconProvider } from "./components/icons";
import { DocsLinkProvider } from "./components/docs-link";
import { DocumentationContent } from "./theme/components/documentation/content";
export {
  createSearchIndex,
  findSearchPages,
  nextSearchResultIndex,
  searchPages,
} from "./search";
import type {
  BreadcrumbProps,
  DocsAppProps,
  DocsModel,
  DocsPage,
  HeyoDocsConfig,
  NavigationGroup,
  OpenApiDocumentSource,
  OpenApiEndpoint,
} from "./types";

export { heyoDocs, validateConfig } from "./config";
export {
  adjacentPages,
  changelogGroupForPage,
  navigationGroupContainsPath,
  navigationFromGroups,
  navigationFromSlugs,
  navigationPages,
  navigationSectionPathForPath,
} from "./navigation";
export {
  createDocsModel,
  findDocsPage,
  findOpenApiEndpoint,
  normaliseDocsPathname,
} from "./model";
export {
  endpointsFromOpenApiDocument,
  endpointsFromOpenApiDocuments,
  isOpenApiDocument,
  openApiDescription,
  openApiEndpointDataPath,
  openApiEndpointDetail,
  resolveOpenApiRef,
  schemaExample,
} from "./openapi";
export { seoForPage, sitemapXml } from "./seo";
export { rssItems, rssXml } from "./rss";
export {
  llmTextForPage,
  llmsFull,
  llmsIndex,
  markdownForPage,
  markdownPathname,
  pathnameFromMarkdownPath,
} from "./llm";
export { resolveTheme } from "./theme";
export { DocumentationContent } from "./theme/components/documentation/content";
export {
  CodeBlock,
  CodeBlockGroup,
} from "./theme/components/documentation/mdx-components";
export { IconProvider } from "./components/icons";
export { DocsLinkProvider } from "./components/docs-link";
export type { DocsLinkComponent, DocsLinkProps } from "./components/docs-link";
export type * from "./types";

function activeSectionLabel(
  navigation: NavigationGroup[],
  currentPath: string,
): string | undefined {
  return navigation
    .flatMap(
      (group) =>
        navigationSectionPathForPath(group.sections, currentPath) ?? [],
    )
    .at(-1)?.section;
}

type BreadcrumbItem = NonNullable<BreadcrumbProps["items"]>[number];

function breadcrumbItemsForPath(
  navigation: NavigationGroup[],
  currentPath: string,
  currentPageLabel: string | undefined,
): BreadcrumbItem[] {
  const group = navigation.find((candidate) =>
    navigationGroupContainsPath(candidate, currentPath),
  );
  const sections = group
    ? navigationSectionPathForPath(group.sections, currentPath)
    : undefined;

  if (!group) {
    return [{ label: currentPageLabel ?? "Documentation" }];
  }

  const groupHref = navigationPages(group.sections)[0]?.slug;
  const items: BreadcrumbItem[] = [
    {
      label: group.group,
      href: groupHref === currentPath ? undefined : groupHref,
    },
  ];

  for (const section of sections ?? []) {
    if (!section.section) continue;
    const sectionHref = navigationPages([section])[0]?.slug;
    items.push({
      label: section.section,
      href: sectionHref === currentPath ? undefined : sectionHref,
    });
  }

  if (currentPageLabel) {
    items.push({ label: currentPageLabel });
  }

  return items;
}

export function DocsApp({
  config,
  iconSet = {},
  isDark,
  onThemeToggle,
  currentOpenApiEndpoint,
  link,
  mdxComponents,
  themeComponents,
  openApiDocuments,
  openApiEndpoints,
  openApiRequestUrl,
  pages,
  pathname,
}: DocsAppProps) {
  return (
    <IconProvider icons={iconSet}>
      <DocsLinkProvider link={link}>
        <DocsAppContent
          config={config}
          currentOpenApiEndpoint={currentOpenApiEndpoint}
          isDark={isDark}
          onThemeToggle={onThemeToggle}
          mdxComponents={mdxComponents}
          themeComponents={themeComponents}
          openApiDocuments={openApiDocuments}
          openApiEndpoints={openApiEndpoints}
          openApiRequestUrl={openApiRequestUrl}
          pages={pages}
          pathname={pathname}
        />
      </DocsLinkProvider>
    </IconProvider>
  );
}

function DocsAppContent({
  config,
  isDark,
  onThemeToggle,
  currentOpenApiEndpoint,
  mdxComponents,
  themeComponents,
  openApiDocuments,
  openApiEndpoints,
  openApiRequestUrl,
  pages,
  pathname,
}: DocsAppProps) {
  const currentPath = normaliseDocsPathname(pathname);
  const model = createDocsModel(
    config,
    pages,
    openApiDocuments,
    openApiEndpoints,
  );
  const page = findDocsPage(model.pages, currentPath);
  const endpoint =
    currentOpenApiEndpoint?.slug === currentPath
      ? currentOpenApiEndpoint
      : findOpenApiEndpoint(model.endpoints, currentPath);
  const changelogGroup = page
    ? changelogGroupForPage(config.groups, page, model.pages)
    : undefined;
  const activePath = page?.slug ?? endpoint?.slug;
  const activeNavigation = activePath
    ? model.navigation.filter((group) =>
        navigationGroupContainsPath(group, activePath),
      )
    : model.navigation;
  const pageNavigation = activePath
    ? adjacentPages(activeNavigation, activePath)
    : {};
  const components = {
    ...resolveTheme(config.theme).components,
    ...themeComponents,
  };
  const {
    Layout,
    TopNavigation,
    Breadcrumb,
    Sidebar,
    DocsPage,
    ChangelogPage,
    OpenApiPage,
    TableOfContents,
    Tabs,
    Search,
    SidebarFooter,
  } = components;
  const search = Search ? (
    <Search
      pages={[
        ...model.pages,
        ...model.endpoints.map((endpoint) => ({
          slug: endpoint.slug,
          title: endpoint.title,
          description:
            endpoint.description ??
            `${endpoint.method.toUpperCase()} ${endpoint.path}`,
          searchContent: [
            endpoint.method,
            endpoint.path,
            endpoint.operationId,
            ...endpoint.tags,
            ...endpoint.parameters.map((parameter) => parameter.name),
          ]
            .filter(Boolean)
            .join(" "),
        })),
      ]}
    />
  ) : undefined;
  const navigationType = changelogGroup
    ? "changelog"
    : endpoint
      ? "openapi"
      : "documentation";
  const tabs = Tabs ? (
    <Tabs
      currentPath={currentPath}
      navigation={model.navigation}
      navigationType={navigationType}
    />
  ) : undefined;
  const breadcrumbItems = changelogGroup
    ? [{ label: changelogGroup.group }]
    : breadcrumbItemsForPath(
        model.navigation,
        currentPath,
        endpoint?.title ?? page?.title,
      );
  const breadcrumb = Breadcrumb ? (
    <Breadcrumb
      items={breadcrumbItems}
      label={
        changelogGroup
          ? changelogGroup.group
          : endpoint
            ? "API Reference"
            : (activeSectionLabel(model.navigation, currentPath) ??
              "Documentation")
      }
    />
  ) : undefined;
  const sidebar = Sidebar ? (
    <Sidebar
      currentPath={currentPath}
      footer={
        SidebarFooter ? (
          <SidebarFooter
            footer={config.footer}
            isDark={isDark}
            onThemeToggle={onThemeToggle}
          />
        ) : undefined
      }
      changelogUpdates={changelogGroup ? page?.changelogUpdates : undefined}
      navigation={activeNavigation}
      search={search}
      tabs={tabs}
    />
  ) : undefined;
  const topNavigation = TopNavigation ? (
    <TopNavigation
      branding={config.branding}
      breadcrumb={breadcrumb}
      isDark={isDark}
      mobileNavigation={sidebar}
      navigation={config.navigation}
      onThemeToggle={onThemeToggle}
      search={search}
      tabs={tabs}
    />
  ) : undefined;
  if (!page && !endpoint) {
    return (
      <Layout
        colors={config.colors}
        sidebar={sidebar}
        topNavigation={topNavigation}
      >
        <article className="heyo-docs-article">
          <p className="heyo-docs-eyebrow">404</p>
          <h1>Page not found</h1>
          <p>The documentation page you requested does not exist.</p>
        </article>
      </Layout>
    );
  }
  return (
    <Layout
      colors={config.colors}
      sidebar={sidebar}
      topNavigation={topNavigation}
    >
      {endpoint ? (
        <OpenApiPage
          endpoint={endpoint}
          key={endpoint.slug}
          next={pageNavigation.next}
          openApiRequestUrl={openApiRequestUrl}
          previous={pageNavigation.previous}
        />
      ) : changelogGroup ? (
        <ChangelogPage
          group={changelogGroup}
          mdxComponents={mdxComponents}
          page={page!}
        />
      ) : (
        <DocsPage
          mdxComponents={mdxComponents}
          next={pageNavigation.next}
          page={page!}
          previous={pageNavigation.previous}
          tableOfContents={
            TableOfContents ? (
              <TableOfContents items={page!.tableOfContents} />
            ) : undefined
          }
        />
      )}
    </Layout>
  );
}
