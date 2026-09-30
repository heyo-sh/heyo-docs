"use client";

import { useEffect, useState } from "react";

import type { ChangelogUpdate } from "../../types";
import { getDocumentationScrollViewport } from "../components/documentation/scroll";

/**
 * Changelog entries replace the page tree for a changelog group. They hang off
 * the same guide rail the section tree uses, with a marker on the rail for the
 * entry currently under the reading line — a feed is one page, so the sidebar
 * has to say where in it you are.
 */
export function HeyoChangelogNavigation({
  updates,
}: {
  updates: ChangelogUpdate[];
}) {
  const [activeId, setActiveId] = useState<string>();

  useEffect(() => {
    const entries = updates
      .map((update) => document.getElementById(update.id))
      .filter((entry): entry is HTMLElement => entry !== null);
    if (!entries.length) return;
    const scrollViewport = getDocumentationScrollViewport();

    const updateActiveEntry = () => {
      const atDocumentEnd = scrollViewport
        ? scrollViewport.scrollTop + scrollViewport.clientHeight >=
          scrollViewport.scrollHeight - 2
        : window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;
      if (atDocumentEnd) {
        setActiveId(entries.at(-1)!.id);
        return;
      }

      const triggerLine = scrollViewport
        ? scrollViewport.getBoundingClientRect().top +
          scrollViewport.clientHeight * (2 / 3)
        : window.innerHeight * (2 / 3);
      let nextId = entries[0]!.id;
      for (const entry of entries) {
        if (entry.getBoundingClientRect().top > triggerLine) break;
        nextId = entry.id;
      }
      setActiveId(nextId);
    };

    const scrollTarget = scrollViewport ?? window;
    scrollTarget.addEventListener("scroll", updateActiveEntry, {
      passive: true,
    });
    window.addEventListener("resize", updateActiveEntry);
    window.addEventListener("hashchange", updateActiveEntry);
    updateActiveEntry();

    return () => {
      scrollTarget.removeEventListener("scroll", updateActiveEntry);
      window.removeEventListener("resize", updateActiveEntry);
      window.removeEventListener("hashchange", updateActiveEntry);
    };
  }, [updates]);

  if (!updates.length) return null;

  return (
    <nav aria-label="Changelog entries" className="p-2">
      <div className="relative ml-1.5 pl-3 before:absolute before:inset-y-1 before:left-0 before:w-px before:bg-border">
        <ul className="flex min-w-0 flex-col gap-px">
          {updates.map((update) => {
            const active = update.id === activeId;
            return (
              <li className="min-w-0" key={update.id}>
                <a
                  aria-current={active ? "location" : undefined}
                  className={[
                    "relative flex min-h-7 w-full min-w-0 items-center rounded-md px-2.5 text-sm transition-[background-color,color] duration-100 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "bg-foreground/[0.06] font-medium text-foreground before:absolute before:top-1/2 before:-left-3 before:h-4 before:w-px before:-translate-y-1/2 before:bg-primary"
                      : "text-muted-foreground hover:bg-foreground/[0.055] hover:text-foreground",
                  ].join(" ")}
                  href={`#${update.id}`}
                >
                  <span className="min-w-0 truncate">{update.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
