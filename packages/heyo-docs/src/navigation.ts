import type {
  ChangelogGroupConfig,
  DocumentationSection,
  DocsGroupConfig,
  DocsPage,
  DocumentationPageReference,
  OpenApiEndpoint,
  NavigationGroup,
  NavigationItem,
  NavigationNode,
  NavigationPage,
  NavigationSection,
  PageNavigationItem,
  ScannedPage,
} from "./types";

export function navigationFromSlugs(
  pages: Array<{ slug: string; title: string }>,
): NavigationNode[] {
  const root: NavigationNode[] = [];
  for (const page of [...pages].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const segments = page.slug.split("/").filter(Boolean);
    if (segments.length === 0) {
      root.unshift({ title: page.title, path: page.slug, children: [] });
      continue;
    }
    let level = root;
    for (const [index, segment] of segments.entries()) {
      let node = level.find(
        (item) => item.title === segmentToTitle(segment) && !item.path,
      );
      const isLeaf = index === segments.length - 1;
      if (isLeaf) {
        level.push({ title: page.title, path: page.slug, children: [] });
        continue;
      }
      if (!node) {
        node = { title: segmentToTitle(segment), children: [] };
        level.push(node);
      }
      level = node.children;
    }
  }
  return root;
}

function segmentToTitle(segment: string): string {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type PageReferenceTarget = Pick<
  ScannedPage | DocsPage,
  "slug" | "title" | "sourcePath"
>;

interface GroupPageReference {
  kind: "changelog" | "documentation";
  location: string;
  reference: string;
}

/**
 * Creates the sidebar from the explicit group/section ordering in
 * heyo-docs.config.ts. A `{ schema }` section generates endpoints in its
 * configured position; changelog pages use their configured MDX updates.
 */
export function navigationFromGroups(
  groups: DocsGroupConfig[],
  pages: PageReferenceTarget[],
  endpoints: OpenApiEndpoint[] = [],
): NavigationGroup[] {
  return groups.flatMap((group, groupIndex): NavigationGroup[] => {
    if (group.type === "changelog") {
      return [
        {
          group: group.group,
          icon: group.icon ?? "changelog",
          public: group.public,
          sections: [
            {
              section: "Updates",
              icon: "changelog",
              expanded: true,
              pages: navigationItemsForReferences(
                group.updates,
                pages,
                `changelog group \"${group.group}\"`,
              ),
            },
          ],
        },
      ];
    }
    return [
      {
        group: group.group,
        icon: group.icon,
        public: group.public,
        sections: group.sections.flatMap((section, sectionIndex) => {
          if ("schema" in section) {
            return openApiSections(
              endpoints.filter(
                (endpoint) =>
                  endpoint.groupIndex === groupIndex &&
                  endpoint.sectionIndex === sectionIndex,
              ),
            );
          }
          return [
            navigationSectionFromConfig(
              section,
              pages,
              documentationSectionLocation(group.group, section),
            ),
          ];
        }),
      },
    ];
  });
}

/** Returns the changelog group that owns a configured MDX page, if any. */
export function changelogGroupForPage(
  groups: DocsGroupConfig[],
  page: PageReferenceTarget,
  pages: PageReferenceTarget[] = [page],
): ChangelogGroupConfig | undefined {
  return groups.find(
    (group): group is ChangelogGroupConfig =>
      group.type === "changelog" &&
      group.updates.some((reference) =>
        pagesForReference(pages, reference).some(
          (candidate) => candidate.slug === page.slug,
        ),
      ),
  );
}

/** Throws a clear error when any configured page or directory resolves to no MDX page. */
export function validateGroupPageReferences(
  groups: DocsGroupConfig[],
  pages: PageReferenceTarget[],
): void {
  const unresolved = groupPageReferences(groups).filter(
    ({ reference }) => pagesForReference(pages, reference).length === 0,
  );

  if (!unresolved.length) return;

  throw new Error(
    unresolved
      .map(({ kind, location, reference }) => {
        if (kind === "changelog") {
          return (
            `Heyo Docs could not resolve changelog reference \"${reference}\" in ${location}. ` +
            "Expected an existing MDX page or directory relative to the configured content directory."
          );
        }
        return (
          `Heyo Docs could not resolve \"${reference}\" in ${location}. ` +
          "Use an existing MDX page or directory relative to the configured content directory."
        );
      })
      .join("\n"),
  );
}

export function adjacentPages(
  navigation: NavigationGroup[],
  currentPath: string,
): {
  next?: PageNavigationItem;
  previous?: PageNavigationItem;
} {
  const pages = navigation.flatMap((group) =>
    navigationPages(group.sections)
      .filter((page) => !page.link)
      .map((page) => ({ href: page.slug, title: page.title })),
  );
  const index = pages.findIndex((page) => page.href === currentPath);

  if (index === -1) return {};

  return {
    next: pages[index + 1],
    previous: pages[index - 1],
  };
}

/** Returns all pages in a section tree in their configured depth-first order. */
export function navigationPages(
  sections: NavigationSection[],
): NavigationPage[] {
  return sections.flatMap((section) => navigationPagesForItems(section.pages));
}

/** True when a navigation item is a nested section rather than a page link. */
export function isNavigationSection(
  item: NavigationItem,
): item is NavigationSection {
  return "pages" in item;
}

/** Finds the ordered section ancestry for a documentation page. */
export function navigationSectionPathForPath(
  sections: NavigationSection[],
  currentPath: string,
): NavigationSection[] | undefined {
  for (const section of sections) {
    const path = navigationSectionPathForItems(section.pages, currentPath);
    if (path) return section.section ? [section, ...path] : path;
  }
  return undefined;
}

/** Whether a group contains a non-link page at the supplied path. */
export function navigationGroupContainsPath(
  group: NavigationGroup,
  currentPath: string,
): boolean {
  return (
    navigationSectionPathForPath(group.sections, currentPath) !== undefined
  );
}

function navigationSectionFromConfig(
  section: DocumentationSection,
  pages: PageReferenceTarget[],
  location: string,
): NavigationSection {
  return {
    section: section.section,
    icon: section.icon,
    expanded: section.expanded,
    pages: navigationItemsForReferences(section.pages, pages, location),
  };
}

function navigationItemsForReferences(
  references: DocumentationPageReference[],
  pages: PageReferenceTarget[],
  location: string,
): NavigationItem[] {
  const selected: NavigationItem[] = [];
  const seen = new Set<string>();

  for (const reference of references) {
    if (typeof reference === "string" || "page" in reference) {
      const pageReference =
        typeof reference === "string" ? reference : reference.page;
      const icon = typeof reference === "string" ? undefined : reference.icon;
      const matches = pagesForReference(pages, pageReference);
      for (const page of matches) {
        const key = `page:${page.slug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        selected.push({
          slug: page.slug,
          title: page.title,
          ...(icon ? { icon } : {}),
        });
      }
      continue;
    }

    if ("pages" in reference) {
      selected.push(
        navigationSectionFromConfig(
          reference,
          pages,
          nestedDocumentationSectionLocation(location, reference),
        ),
      );
      continue;
    }

    const key = `link:${reference.src}`;
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push({
      slug: reference.src,
      title: reference.title,
      link: true,
      ...(reference.icon ? { icon: reference.icon } : {}),
    });
  }

  return selected;
}

function navigationPagesForItems(items: NavigationItem[]): NavigationPage[] {
  return items.flatMap((item) =>
    isNavigationSection(item) ? navigationPagesForItems(item.pages) : [item],
  );
}

function navigationSectionPathForItems(
  items: NavigationItem[],
  currentPath: string,
): NavigationSection[] | undefined {
  for (const item of items) {
    if (isNavigationSection(item)) {
      const path = navigationSectionPathForItems(item.pages, currentPath);
      if (path) return [item, ...path];
      continue;
    }
    if (!item.link && item.slug === currentPath) return [];
  }
  return undefined;
}

function openApiSections(endpoints: OpenApiEndpoint[]) {
  const sections = new Map<string, NavigationPage[]>();
  const expanded = true;
  for (const endpoint of endpoints) {
    const section = endpoint.tags[0] ?? "Endpoints";
    const items = sections.get(section) ?? [];
    items.push({
      slug: endpoint.slug,
      title: endpoint.title,
      method: endpoint.method,
    });
    sections.set(section, items);
  }
  return [...sections].map(([section, pages]) => ({
    section,
    expanded,
    pages,
  }));
}

/**
 * Resolves a reference against scanned source paths. An extension-free
 * reference selects an exact MDX file first, then falls back to the matching
 * directory. A trailing slash explicitly selects a directory when both exist.
 */
function pagesForReference(
  pages: PageReferenceTarget[],
  reference: string,
): PageReferenceTarget[] {
  const normalisedReference = normaliseReference(reference);
  if (normalisedReference === "")
    return pages.filter((page) => page.slug === "/");

  const hasExtension = /\.mdx?$/i.test(normalisedReference);
  const exactFile = pages.filter((page) => {
    const sourcePath = page.sourcePath?.replaceAll("\\", "/");
    if (!sourcePath) return false;
    return hasExtension
      ? sourcePath === normalisedReference
      : removeMdxExtension(sourcePath) === normalisedReference;
  });

  const requestsDirectory = /\/$/.test(reference.trim());
  if (!requestsDirectory && exactFile.length > 0) return exactFile;

  const directory = pages.filter((page) =>
    page.sourcePath
      ?.replaceAll("\\", "/")
      .startsWith(`${normalisedReference}/`),
  );
  if (directory.length > 0) return directory;

  // Source paths are optional on framework-neutral page models. Preserve
  // extension-free references for those consumers when no source is present.
  const slug = `/${removeMdxExtension(normalisedReference)}`;
  const matchingSlug = pages.filter(
    (page) =>
      !page.sourcePath &&
      (page.slug === slug || page.slug.startsWith(`${slug}/`)),
  );
  return hasExtension
    ? matchingSlug.filter((page) => page.slug === slug)
    : matchingSlug;
}

function groupPageReferences(groups: DocsGroupConfig[]): GroupPageReference[] {
  return groups.flatMap((group): GroupPageReference[] => {
    if (group.type === "documentation") {
      return group.sections.flatMap((section) => {
        if ("schema" in section) return [];
        return pageReferencesForSection(
          section,
          documentationSectionLocation(group.group, section),
        );
      });
    }
    return group.updates.map((reference) => ({
      kind: "changelog",
      location: `changelog group \"${group.group}\"`,
      reference,
    }));
  });
}

function pageReferencesForSection(
  section: DocumentationSection,
  location: string,
): GroupPageReference[] {
  return section.pages.flatMap((reference): GroupPageReference[] => {
    if (typeof reference === "string") {
      return [{ kind: "documentation", location, reference }];
    }
    if ("page" in reference) {
      return [{ kind: "documentation", location, reference: reference.page }];
    }
    if ("pages" in reference) {
      return pageReferencesForSection(
        reference,
        nestedDocumentationSectionLocation(location, reference),
      );
    }
    return [];
  });
}

function documentationSectionLocation(
  group: string,
  section: DocumentationSection,
): string {
  return section.section
    ? `group \"${group}\", section \"${section.section}\"`
    : `group \"${group}\", unsectioned pages`;
}

function nestedDocumentationSectionLocation(
  location: string,
  section: DocumentationSection,
): string {
  return section.section
    ? `${location}, section \"${section.section}\"`
    : `${location}, unsectioned pages`;
}

function normaliseReference(reference: string): string {
  return reference
    .trim()
    .replaceAll("\\", "/")
    .replace(/^(?:\.\/|\/)+/, "")
    .replace(/\/+$/, "");
}

function removeMdxExtension(value: string): string {
  return value.replace(/\.mdx?$/i, "");
}
