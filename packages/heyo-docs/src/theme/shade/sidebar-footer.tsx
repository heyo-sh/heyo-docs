import { Icon } from "../../components/icons";
import type { SidebarFooterProps } from "../../types";

/** The Shade footer retains external links; theme switching lives in the header. */
export function ShadeSidebarFooter({ footer }: SidebarFooterProps) {
  return (
    <footer className="flex h-12 items-center gap-1 px-4">
      {footer.website ? (
        <a
          aria-label="Website"
          className="inline-flex size-8 items-center justify-center rounded-md text-foreground/60 transition-colors hover:text-foreground"
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
          className="inline-flex size-8 items-center justify-center rounded-md text-foreground/60 transition-colors hover:text-foreground"
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
