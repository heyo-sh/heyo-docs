"use client";

import { useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import type { ChangelogUpdate } from "../../types";

export function ShadeChangelogNavigation({
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

    const updateActiveEntry = () => {
      const atDocumentEnd =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
      if (atDocumentEnd) {
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
    <nav aria-label="Changelog entries" className="my-10 p-3">
      <ul>
        {updates.map((update) => {
          const active = update.id === activeId;
          return (
            <li key={update.id}>
              <Button
                aria-current={active ? "location" : undefined}
                className="hover:bg-secondary hover:text-secondary-foreground"
                nativeButton={false}
                render={<a href={`#${update.id}`} />}
                variant={active ? "secondary" : "ghost"}
              >
                {update.label}
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
