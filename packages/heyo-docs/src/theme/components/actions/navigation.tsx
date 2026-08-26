import type { PageNavigationItem } from "../../../types";
import { cn } from "../../../lib/utils";
import { DocsLink } from "../../../components/docs-link";

interface PageNavigationProps {
  next?: PageNavigationItem;
  previous?: PageNavigationItem;
}

export function PageNavigation({ next, previous }: PageNavigationProps) {
  return (
    <div className="mb-6">
      {previous || next ? (
        <>
          <nav
            aria-label="Page navigation"
            className="mt-12 flex items-stretch justify-between gap-2"
          >
            {previous ? (
              <DocsLink
                className="group flex min-w-0 max-w-[48%] flex-1 flex-col rounded-md border border-foreground/[0.08] px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03]"
                href={previous.href}
                style={{ textDecoration: "none" }}
              >
                <span className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-foreground/70">
                  {previous.title}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  &lt; Previous
                </span>
              </DocsLink>
            ) : (
              <span />
            )}
            {next ? (
              <DocsLink
                className="group ml-auto flex min-w-0 max-w-[48%] flex-1 flex-col items-end rounded-md border border-foreground/[0.08] px-4 py-3 text-right transition-colors hover:bg-foreground/[0.03]"
                href={next.href}
                style={{ textDecoration: "none" }}
              >
                <span className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-foreground/70">
                  {next.title}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Next &gt;
                </span>
              </DocsLink>
            ) : null}
          </nav>
          <PoweredByHeyoDocs />
        </>
      ) : (
        <PoweredByHeyoDocs className="mt-12" />
      )}
    </div>
  );
}

interface PoweredByHeyoDocsProps {
  className?: string;
}

export function PoweredByHeyoDocs({ className }: PoweredByHeyoDocsProps) {
  return (
    <p
      className={cn("mt-3 text-right text-xs text-muted-foreground", className)}
    >
      Powered by{" "}
      <a
        className="underline underline-offset-2 transition-colors hover:text-foreground"
        href="https://heyo-docs.com"
        rel="noreferrer"
        target="_blank"
      >
        heyo-docs
      </a>
    </p>
  );
}
