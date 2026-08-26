import { Icon } from "../../components/icons";
import type { SidebarFooterProps } from "../../types";

/** External destinations remain anchored at the bottom of the sidebar. */
export function MossSidebarFooter({ footer }: SidebarFooterProps) {
  return (
    <footer className="flex h-12 items-center gap-2 border-t border-border px-4">
      {footer.website ? (
        <a
          aria-label="Website"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          href={footer.website}
          rel="noreferrer"
          target="_blank"
        >
          <Icon className="size-4" name="globe" />
        </a>
      ) : null}
      {footer.github ? (
        <a
          aria-label="GitHub"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          href={footer.github}
          rel="noreferrer"
          target="_blank"
        >
          <Icon className="size-4" name="github" />
        </a>
      ) : null}
    </footer>
  );
}
