import type { SearchProps } from "../../types";
import { DocumentationSearch } from "../components/search";
import { SearchGlyph } from "./glyphs";

const keyClassName =
  "inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-sm bg-muted px-1 font-mono text-[0.6875rem] leading-none text-muted-foreground ring-1 ring-border";

/**
 * One 32px control at the top of the sidebar, with the shortcut spelled out on
 * the right. It is the same dialog every theme uses — only the affordance is
 * heyo's: a card-coloured field on the canvas, a single hairline ring, and
 * keycaps rather than a hint in prose.
 *
 * It is a button rather than a read-only input. A text field is always treated
 * as keyboard-focused, so returning focus to one after the dialog closes leaves
 * a focus ring parked on a control the reader only clicked.
 */
export function HeyoSearch(props: SearchProps) {
  return (
    <DocumentationSearch
      {...props}
      trigger="button"
      triggerClassName="h-8 cursor-pointer gap-2 rounded-lg bg-card px-2.5 text-sm text-muted-foreground shadow-xs ring-1 ring-border transition-colors duration-100 hover:bg-muted hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring"
      triggerContent={
        <>
          <SearchGlyph aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">
            Search documentation
          </span>
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center gap-0.5"
          >
            <kbd className={keyClassName}>⌘</kbd>
            <kbd className={keyClassName}>K</kbd>
          </span>
        </>
      }
    />
  );
}
