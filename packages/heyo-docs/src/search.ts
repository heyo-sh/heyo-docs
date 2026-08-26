import { create, insert, search } from "zbsearch";

import type { SearchDocument } from "./types";

const RESULT_LIMIT = 8;

const SEARCH_SCHEMA = {
  slug: "string",
  title: "string",
  description: "string",
  content: "string",
} as const;

type SearchSchema = typeof SEARCH_SCHEMA;
type SearchIndex = ReturnType<typeof create<SearchSchema>>;

export interface LocalSearchIndex {
  index: SearchIndex;
  pagesBySlug: Map<string, SearchDocument>;
}

function pageSearchText(page: SearchDocument): string {
  return [
    page.title,
    page.description,
    ...(page.tableOfContents ?? []).map((item) => item.title),
    page.searchContent,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Creates the local, theme-agnostic search index used by a search UI. */
export function createSearchIndex(pages: SearchDocument[]): LocalSearchIndex {
  const index = create<SearchSchema>({ schema: SEARCH_SCHEMA });

  pages.forEach((page) => {
    insert(index, {
      slug: page.slug,
      title: page.title,
      description: page.description ?? "",
      content: pageSearchText(page),
    });
  });

  return {
    index,
    pagesBySlug: new Map(pages.map((page) => [page.slug, page])),
  };
}

/** Searches a previously-created index without choosing any visual treatment. */
export function findSearchPages(
  searchIndex: LocalSearchIndex,
  query: string,
): SearchDocument[] {
  if (!query.trim()) return [];

  const result = search(searchIndex.index, {
    term: query,
    limit: RESULT_LIMIT,
    properties: ["title", "description", "content"],
    boost: { title: 3, description: 2 },
    tolerance: 1,
  });

  // The built-in ZBSearch components are synchronous. Preserve the search
  // UI contract if that ever changes upstream.
  if (result instanceof Promise) return [];

  return result.hits
    .map((hit) => searchIndex.pagesBySlug.get(hit.document.slug))
    .filter((page): page is SearchDocument => page !== undefined);
}

/** Convenience helper for consumers that do not need to retain the index. */
export function searchPages(
  pages: SearchDocument[],
  query: string,
): SearchDocument[] {
  return findSearchPages(createSearchIndex(pages), query);
}

export function nextSearchResultIndex(
  currentIndex: number,
  resultCount: number,
  direction: "next" | "previous",
): number {
  if (resultCount === 0) return -1;
  if (currentIndex < 0) return direction === "next" ? 0 : resultCount - 1;
  if (direction === "next") return (currentIndex + 1) % resultCount;
  return (currentIndex - 1 + resultCount) % resultCount;
}
