"use client";

import { useEffect, useState } from "react";

import type { ChangelogUpdate } from "../../../types";

interface ChangelogTableOfContentsProps {
  updates: ChangelogUpdate[];
}

/** Date-based navigation used in place of section navigation for changelog groups. */
export function ChangelogTableOfContents({
  updates,
}: ChangelogTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>();

  useEffect(() => {
    const entries = updates
      .map((update) => document.getElementById(update.id))
      .filter((entry): entry is HTMLElement => entry !== null);
    if (!entries.length) return;

    const updateActiveEntry = () => {
      const isAtDocumentEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      if (isAtDocumentEnd) {
        setActiveId(entries.at(-1)!.id);
        return;
      }

      const triggerLine = window.innerHeight * (2 / 3);
      let nextId = entries[0]!.id;
      for (const entry of entries) {
        if (entry.getBoundingClientRect().top > triggerLine) break;
        nextId = entry.id;
      }
      setActiveId(nextId);
    };

    window.addEventListener("scroll", updateActiveEntry, { passive: true });
    window.addEventListener("resize", updateActiveEntry);
    window.addEventListener("hashchange", updateActiveEntry);
    updateActiveEntry();

    return () => {
      window.removeEventListener("scroll", updateActiveEntry);
      window.removeEventListener("resize", updateActiveEntry);
      window.removeEventListener("hashchange", updateActiveEntry);
    };
  }, [updates]);

  if (!updates.length) return null;

  return (
    <nav aria-label="Changelog entries" className="py-2">
      <ul>
        {updates.map((update) => {
          const active = update.id === activeId;
          return (
            <li key={update.id}>
              <a
                aria-current={active ? "location" : undefined}
                className={`relative flex w-full items-center px-4 py-2 text-sm transition-colors ${
                  active
                    ? "bg-foreground/[0.03] text-foreground/90 before:absolute before:inset-y-1.5 before:left-0 before:w-px before:bg-primary"
                    : "text-foreground/65 hover:bg-foreground/[0.03] hover:text-foreground/90"
                }`}
                href={`#${update.id}`}
              >
                {update.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
