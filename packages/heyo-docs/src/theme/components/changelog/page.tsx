"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Badge } from "../../../components/ui/badge";
import { markdownPathname } from "../../../llm";
import type { ChangelogPageProps } from "../../../types";
import { CopyForLlm } from "../actions/copy-for-llm";
import { Open } from "../actions/open";
import { PoweredByHeyoDocs } from "../actions/navigation";
import { documentationContentClassName } from "../documentation/content";
import {
  DocumentationCodeBlock,
  documentationMdxComponents,
} from "../documentation/mdx-components";
import { ChangelogFilters } from "./filters";

const DEFAULT_CHANGELOG_DESCRIPTION =
  "Stay up to date with the latest changes and improvements.";

interface ChangelogFilterContextValue {
  selectedTags: string[];
}

const ChangelogFilterContext = createContext<ChangelogFilterContextValue>({
  selectedTags: [],
});

function slugFromLabel(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "update"
  );
}

function tagsFromLocation(availableTags: string[]) {
  const tags = new URLSearchParams(window.location.search)
    .get("tags")
    ?.split(",")
    .map((tag) => tag.trim())
    .filter((tag): tag is string => Boolean(tag));
  return [...new Set(tags ?? [])].filter((tag) => availableTags.includes(tag));
}

/**
 * One MDX changelog entry. Labels should be unique because they are used as
 * in-page anchors and in the right-hand changelog navigation.
 */
export function Update({
  children,
  date: _date,
  label,
  tags = [],
}: {
  children?: ReactNode;
  /** ISO 8601 publication date used by the generated RSS feed. */
  date?: string;
  label: string;
  tags?: string[];
}) {
  const { selectedTags } = useContext(ChangelogFilterContext);
  const visible = selectedTags.every((tag) => tags.includes(tag));
  const id = slugFromLabel(label);

  return (
    <section
      aria-label={label}
      className="group/update relative scroll-mt-20 border-t border-foreground/[0.07] py-9 first:border-t-0 first:pt-0 md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-x-8"
      hidden={!visible}
      id={id}
    >
      <div className="mb-5 md:mb-0">
        <a
          aria-label={`Link to ${label}`}
          className="inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-ring"
          href={`#${id}`}
        >
          <Badge className="h-6 rounded-md px-2.5 text-xs" variant="outline">
            {label}
          </Badge>
        </a>
        {tags.length ? (
          <div className="mt-3 flex flex-col items-start gap-1.5">
            {tags.map((tag) => (
              <Badge
                className="max-w-full truncate"
                key={tag}
                variant="secondary"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className={documentationContentClassName}>{children}</div>
    </section>
  );
}

function DocumentTitle() {
  return null;
}

/** A Mintlify-style changelog page that preserves the Grain documentation shell. */
export function ChangelogPage({
  group,
  mdxComponents,
  page,
}: ChangelogPageProps) {
  const Content = page.content;
  const markdownUrl = markdownPathname(page.slug);
  const updates = page.changelogUpdates ?? [];
  const availableTags = useMemo(
    () =>
      [...new Set(updates.flatMap((update) => update.tags))].sort(
        (first, second) => first.localeCompare(second),
      ),
    [updates],
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    const syncFromLocation = () =>
      setSelectedTags(tagsFromLocation(availableTags));
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [availableTags]);

  const setTags = useCallback(
    (nextTags: string[]) => {
      const tags = [...new Set(nextTags)].filter((tag) =>
        availableTags.includes(tag),
      );
      setSelectedTags(tags);

      const url = new URL(window.location.href);
      if (tags.length) url.searchParams.set("tags", tags.join(","));
      else url.searchParams.delete("tags");
      window.history.replaceState(window.history.state, "", url);
    },
    [availableTags],
  );

  return (
    <ChangelogFilterContext.Provider value={{ selectedTags }}>
      <div className="min-w-0">
        <div className="grid gap-y-10 xl:items-start xl:grid-cols-[minmax(0,50rem)_minmax(13rem,17rem)] xl:gap-x-16 xl:gap-y-0">
          <article className="min-w-0 max-w-[50rem]">
            <header className="border-b border-foreground/[0.06] pb-8">
              <div className="flex items-start justify-between gap-4">
                <h1 className="min-w-0 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-[2.625rem]">
                  {group.group}
                </h1>
                <div className="flex shrink-0 items-center gap-2">
                  <CopyForLlm markdownUrl={markdownUrl} />
                  <Open markdownUrl={markdownUrl} />
                </div>
              </div>
              <p className="mb-0 mt-4 max-w-2xl text-[1.0625rem] leading-7 text-muted-foreground">
                {group.description ?? DEFAULT_CHANGELOG_DESCRIPTION}
              </p>
            </header>
            <div className="mt-10">
              <Content
                components={{
                  ...documentationMdxComponents,
                  ...mdxComponents,
                  h1: DocumentTitle as never,
                  pre: DocumentationCodeBlock as never,
                  Update: Update as never,
                }}
              />
            </div>
            <div className="mb-6 mt-12">
              <PoweredByHeyoDocs />
            </div>
          </article>
          {availableTags.length ? (
            <ChangelogFilters
              onSelectedTagsChange={setTags}
              selectedTags={selectedTags}
              tags={availableTags}
            />
          ) : null}
        </div>
      </div>
    </ChangelogFilterContext.Provider>
  );
}
