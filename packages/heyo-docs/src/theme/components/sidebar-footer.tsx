import type { SidebarFooterProps } from "../../types";
import { Icon } from "../../components/icons";

export function SidebarFooter({
  footer,
  isDark = false,
  onThemeToggle,
}: SidebarFooterProps) {
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
      <button
        aria-label={isDark ? "Use light theme" : "Use dark theme"}
        className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-foreground/60 transition-colors hover:text-foreground"
        onClick={onThemeToggle}
        type="button"
      >
        {isDark ? (
          <Icon className="size-4" name="sun" />
        ) : (
          <Icon className="size-4" name="moon" />
        )}
      </button>
    </footer>
  );
}
