import { DocsLink } from "../../components/docs-link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import type { TopNavigationProps } from "../../types";
import { HeyoBrand } from "./brand";
import { MenuGlyph, MoonGlyph, SunGlyph } from "./glyphs";

const iconButtonClassName =
  "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 hover:bg-foreground/[0.055] hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * A 48px bar. The brand sits in the column the sidebar occupies below it, so
 * the hairline under the mark runs straight into the sidebar's own edge; the
 * breadcrumb takes the rest. Search lives in the sidebar, not here — one
 * ⌘K owner per page.
 */
export function HeyoTopNavigation({
  branding,
  breadcrumb,
  isDark = false,
  mobileNavigation,
  navigation,
  onThemeToggle,
}: TopNavigationProps) {
  return (
    <header className="heyo-docs-enter heyo-docs-enter--top-navigation sticky top-0 z-40 flex h-12 items-center border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {mobileNavigation ? (
        <Sheet>
          <SheetTrigger
            aria-label="Open documentation navigation"
            className={`${iconButtonClassName} ml-2 lg:hidden`}
          >
            <MenuGlyph className="size-4" />
            <span className="sr-only">Open documentation navigation</span>
          </SheetTrigger>
          <SheetContent
            aria-describedby={undefined}
            className="flex flex-col gap-0 p-0 data-[side=left]:w-[min(19rem,calc(100vw-3rem))]"
            side="left"
          >
            <SheetHeader className="min-h-12 shrink-0 flex-row items-center gap-2 border-b border-border px-3 py-0">
              <SheetTitle className="sr-only">
                Documentation navigation
              </SheetTitle>
              <HeyoBrand branding={branding} />
            </SheetHeader>
            {mobileNavigation}
          </SheetContent>
        </Sheet>
      ) : null}
      <DocsLink
        aria-label={branding.name}
        className="flex h-full min-w-0 shrink-0 items-center gap-2 px-3 sm:px-4 lg:w-60 lg:border-r lg:border-border xl:w-64"
        href="/"
      >
        <HeyoBrand branding={branding} />
      </DocsLink>
      <div className="hidden min-w-0 flex-1 items-center lg:flex">
        {breadcrumb}
      </div>
      <div
        className="ml-auto flex items-center gap-1 px-2 sm:px-3"
        data-slot="navigation"
      >
        {navigation}
        <button
          aria-label={isDark ? "Use light theme" : "Use dark theme"}
          className={iconButtonClassName}
          onClick={onThemeToggle}
          type="button"
        >
          {isDark ? (
            <SunGlyph className="size-4" />
          ) : (
            <MoonGlyph className="size-4" />
          )}
        </button>
      </div>
    </header>
  );
}
