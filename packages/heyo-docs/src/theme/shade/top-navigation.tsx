import { DocsLink } from "../../components/docs-link";
import { Icon } from "../../components/icons";
import { Button } from "../../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import type { TopNavigationProps } from "../../types";
import { HeyoDocsLogo } from "../grain/heyo-docs-logo";

export function ShadeTopNavigation({
  branding,
  isDark = false,
  mobileNavigation,
  navigation,
  onThemeToggle,
  search,
  tabs,
}: TopNavigationProps) {
  return (
    <header className="heyo-docs-enter heyo-docs-enter--top-navigation sticky top-0 z-40 flex h-14 items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {mobileNavigation ? (
        <Sheet>
          <SheetTrigger
            render={
              <Button
                aria-label="Open documentation navigation"
                className="ml-1 lg:hidden"
                size="icon-lg"
                variant="ghost"
              />
            }
          >
            <Icon name="menu" />
            <span className="sr-only">Open documentation navigation</span>
          </SheetTrigger>
          <SheetContent
            aria-describedby={undefined}
            className="data-[side=left]:w-[min(20rem,calc(100vw-3rem))] p-0"
            side="left"
          >
            <SheetHeader className="min-h-14 shrink-0 justify-center border-b border-border px-4 py-0">
              <SheetTitle>Documentation navigation</SheetTitle>
            </SheetHeader>
            {mobileNavigation}
          </SheetContent>
        </Sheet>
      ) : null}
      <DocsLink
        aria-label={branding.name}
        className="flex shrink-0 items-center px-3 sm:px-4 lg:w-[18.75rem]"
        href="/"
      >
        {branding.logo ? (
          <img className="max-h-6" src={branding.logo} alt="" />
        ) : (
          <HeyoDocsLogo />
        )}
      </DocsLink>
      <div className="hidden min-w-0 flex-1 items-center lg:flex">{tabs}</div>
      <div
        className="ml-auto flex items-center gap-1 px-3 sm:px-5"
        data-slot="navigation"
      >
        {search ? <div className="hidden w-56 lg:block">{search}</div> : null}
        {navigation}
        <Button
          aria-label={isDark ? "Use light theme" : "Use dark theme"}
          onClick={onThemeToggle}
          size="icon"
          variant="ghost"
        >
          <Icon name={isDark ? "sun" : "moon"} />
        </Button>
      </div>
    </header>
  );
}
