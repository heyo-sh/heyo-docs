import { Icon } from "../../components/icons";
import type { SearchProps } from "../../types";
import { DocumentationSearch } from "../components/search";

/** A full-width, Mintlify-style search trigger for the sidebar. */
export function MossSearch(props: SearchProps) {
  return (
    <div className="relative">
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        name="search"
      />
      <DocumentationSearch
        {...props}
        trigger="input"
        triggerClassName="h-10 rounded-lg border border-border bg-muted/45 py-0 pl-9 text-sm shadow-none hover:bg-muted/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-muted/30"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border bg-background/80 px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground">
        ⌘ K
      </kbd>
    </div>
  );
}
