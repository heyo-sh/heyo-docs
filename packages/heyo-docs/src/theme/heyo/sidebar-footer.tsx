import type { SidebarFooterProps } from "../../types";
import { GithubGlyph, GlobeGlyph } from "./glyphs";

const linkClassName =
  "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 hover:bg-foreground/[0.055] hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * External destinations, pinned to the bottom edge. Colour mode is toggled
 * from the header instead — it has to stay reachable when the sidebar is a
 * closed drawer.
 *
 * With nothing configured the footer renders nothing at all: an empty 44px
 * strip with a hairline above it is a border pretending to be a feature.
 */
export function HeyoSidebarFooter({ footer }: SidebarFooterProps) {
  if (!footer.website && !footer.github) return null;

  return (
    <footer className="flex h-11 shrink-0 items-center gap-1 border-t border-border px-2">
      {footer.website ? (
        <a
          aria-label="Website"
          className={linkClassName}
          href={footer.website}
          rel="noreferrer"
          target="_blank"
        >
          <GlobeGlyph className="size-4" />
        </a>
      ) : null}
      {footer.github ? (
        <a
          aria-label="GitHub"
          className={linkClassName}
          href={footer.github}
          rel="noreferrer"
          target="_blank"
        >
          <GithubGlyph className="size-4" />
        </a>
      ) : null}
    </footer>
  );
}
