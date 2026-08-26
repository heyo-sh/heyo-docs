"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";
import {
  createSearchIndex,
  findSearchPages,
  nextSearchResultIndex,
} from "../../search";
import type { SearchDocument, SearchProps } from "../../types";
import { Icon } from "../../components/icons";
import { DocsLink } from "../../components/docs-link";

function excerptFor(page: SearchDocument): string {
  const text = page.description || page.searchContent || "";
  const shortened = text.replace(/\s+/g, " ").trim().slice(0, 160);
  return shortened.length === 160 ? `${shortened}…` : shortened;
}

function highlightText(text: string, query: string): ReactNode {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => term.toLocaleLowerCase());

  if (terms.length === 0) return text;

  const pattern = new RegExp(
    `(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );

  return text.split(pattern).map((part, index) =>
    terms.includes(part.toLocaleLowerCase()) ? (
      <mark
        className="bg-transparent font-semibold text-primary"
        key={`${part}-${index}`}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function DocumentationSearch({
  pages,
  trigger = "button",
  triggerClassName,
}: SearchProps & {
  trigger?: "button" | "input";
  /** Theme-specific presentation for the compact input trigger. */
  triggerClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchIndex = useMemo(() => createSearchIndex(pages), [pages]);
  const results = useMemo(() => {
    return findSearchPages(searchIndex, query);
  }, [query, searchIndex]);

  useEffect(() => {
    setSelectedIndex((currentIndex) => {
      if (results.length === 0) return -1;
      return Math.min(Math.max(currentIndex, 0), results.length - 1);
    });
  }, [results.length]);

  useEffect(() => {
    resultRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey))
        return;

      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  };

  const selectPage = (page: SearchDocument) => {
    onOpenChange(false);
    window.location.assign(page.slug);
  };

  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex((currentIndex) =>
        nextSearchResultIndex(currentIndex, results.length, "next"),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setSelectedIndex((currentIndex) =>
        nextSearchResultIndex(currentIndex, results.length, "previous"),
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      selectPage(results[selectedIndex] ?? results[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger === "input" ? (
        <Input
          aria-keyshortcuts="Control+K Meta+K"
          aria-label="Search documentation"
          className={cn(
            "h-8 cursor-pointer border-0 bg-secondary px-3 text-xs shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-secondary",
            triggerClassName,
          )}
          onClick={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            setOpen(true);
          }}
          placeholder="Search documentation..."
          readOnly
        />
      ) : (
        <button
          aria-keyshortcuts="Control+K Meta+K"
          className="flex h-10 w-full items-center gap-2 px-4 text-sm text-foreground/60 transition-colors hover:bg-foreground/[0.03] hover:text-foreground"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Icon className="size-4 shrink-0" name="search" />
          <span className="min-w-0 flex-1 text-left">Search</span>
          <kbd className="hidden rounded border border-foreground/10 bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground sm:inline">
            ⌘ K
          </kbd>
        </button>
      )}
      <DialogContent
        className="gap-0 overflow-hidden p-0 text-foreground shadow-xl sm:max-w-xl"
        onKeyDownCapture={onSearchKeyDown}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Search documentation</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-5">
          <span className="shrink-0 text-muted-foreground">
            <Icon className="size-4" name="search" />
          </span>
          <Input
            ref={inputRef}
            aria-label="Search documentation"
            className="h-7 border-0 bg-transparent px-2 text-[1.0625rem] shadow-none placeholder:text-muted-foreground/70 focus-visible:border-0 focus-visible:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documentation"
            aria-activedescendant={
              selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
            }
            aria-controls="search-results"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              type="button"
            >
              <Icon className="size-3.5" name="close" />
            </button>
          ) : null}
          <kbd className="inline-flex h-5 shrink-0 items-center rounded border border-border bg-muted px-1.5 font-mono text-[0.625rem] font-semibold text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-[min(31rem,65vh)] overflow-y-auto overscroll-contain p-2.5 sm:p-3">
          {!query.trim() ? (
            <div className="flex flex-col items-center px-6 py-11 text-center">
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="size-5" name="search" />
              </span>
              <p className="text-sm font-medium text-foreground">
                Find anything in the docs
              </p>
              <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                Search pages, headings, and content.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-11 text-center">
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="size-5" name="search" />
              </span>
              <p className="text-sm font-semibold text-foreground">
                No results for “{query}”
              </p>
              <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                Try another word or a shorter phrase.
              </p>
            </div>
          ) : (
            <ul
              aria-label="Search results"
              className="space-y-1.5"
              id="search-results"
              role="listbox"
            >
              <li className="px-2.5 pb-1 pt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Documentation
              </li>
              {results.map((page, index) => (
                <li key={page.slug}>
                  <DocsLink
                    aria-selected={selectedIndex === index}
                    className={cn(
                      "group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                      selectedIndex === index && "bg-muted",
                    )}
                    href={page.slug}
                    id={`search-result-${index}`}
                    onClick={() => onOpenChange(false)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    ref={(element) => {
                      resultRefs.current[index] = element;
                    }}
                    role="option"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-colors group-hover:text-primary">
                      <Icon className="size-4" name="file" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {highlightText(page.title, query)}
                      </span>
                      <span className="mt-1 block text-[0.6875rem] text-muted-foreground">
                        Documentation{" "}
                        <span className="mx-1 text-muted-foreground/60">›</span>{" "}
                        {page.title}
                      </span>
                      {excerptFor(page) ? (
                        <span className="mt-1.5 block line-clamp-2 text-[0.8125rem] leading-5 text-muted-foreground">
                          {highlightText(excerptFor(page), query)}
                        </span>
                      ) : null}
                    </span>
                    <Icon
                      className={cn(
                        "mt-1 size-4 shrink-0 text-primary opacity-0 transition-opacity",
                        selectedIndex === index && "opacity-100",
                      )}
                      name="arrowRight"
                    />
                  </DocsLink>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-border bg-muted/50 px-4 py-2.5 sm:px-5">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1 text-muted-foreground">
                <Icon className="size-3" name="cornerDownLeft" />
              </kbd>
              open
            </span>
            <span className="inline-flex items-center gap-0.5">
              <kbd className="inline-flex size-5 items-center justify-center rounded border border-border bg-background text-muted-foreground">
                <Icon className="size-3" name="arrowUp" />
              </kbd>
              <kbd className="inline-flex size-5 items-center justify-center rounded border border-border bg-background text-muted-foreground">
                <Icon className="size-3" name="arrowDown" />
              </kbd>
              navigate
            </span>
          </p>
          <a
            className="shrink-0 text-[0.6875rem] text-muted-foreground transition-colors hover:text-foreground"
            href="https://www.zbsearch.dev/"
            rel="noreferrer"
            target="_blank"
          >
            Powered by{" "}
            <span className="font-semibold text-foreground">ZBSearch</span>
          </a>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
