import { Button } from "../../components/ui/button";
import { Icon } from "../../components/icons";
import { DocsLink } from "../../components/docs-link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import type { TopNavigationProps } from "../../types";
import { HeyoDocsLogo } from "./heyo-docs-logo";

export function GrainTopNavigation({
  branding,
  breadcrumb,
  mobileNavigation,
  navigation,
}: TopNavigationProps) {
  return (
    <header className="heyo-docs-enter heyo-docs-enter--top-navigation sticky top-0 z-40 flex h-14 items-center border-b border-foreground/5 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {mobileNavigation ? (
        <Sheet>
          <SheetTrigger
            render={
              <Button
                aria-label="Open documentation navigation"
                className="lg:hidden"
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
            <SheetHeader className="min-h-14 shrink-0 justify-center border-b border-foreground/5 px-4 py-0">
              <SheetTitle>Documentation navigation</SheetTitle>
            </SheetHeader>
            {mobileNavigation}
          </SheetContent>
        </Sheet>
      ) : null}
      <DocsLink
        aria-label={branding.name}
        className="flex shrink-0 items-center border-r border-foreground/5 px-3 sm:px-4 lg:w-[18.75rem]"
        href="/"
      >
        {branding.logo ? (
          <img className="max-h-6" src={branding.logo} alt="" />
        ) : (
          <HeyoDocsLogo />
        )}
      </DocsLink>
      <div className="hidden min-w-0 flex-1 lg:flex">{breadcrumb}</div>
      <div
        className="ml-auto flex items-center gap-1 px-3 sm:px-5"
        data-slot="navigation"
      >
        {navigation}
      </div>
    </header>
  );
}
