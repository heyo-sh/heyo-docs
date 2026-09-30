import type { CSSProperties } from "react";

import { ScrollArea } from "../../components/ui/scroll-area";
import type { LayoutProps } from "../../types";
import { documentationScrollAreaId } from "../components/documentation/scroll";

/**
 * A full-bleed console shell: a 48px header, a 15rem sidebar that shares the
 * page fill, and one scrolling content column. Nothing is centred inside a
 * 1600px frame — an application chrome uses the screen it was given, and the
 * reading measure is held by the content column itself.
 */
export function HeyoLayout({
  children,
  colors,
  sidebar,
  topNavigation,
}: LayoutProps) {
  const colorVariables: CSSProperties & Record<string, string> = {
    ...(colors.primary ? { "--primary": colors.primary } : {}),
    ...(colors.secondary ? { "--secondary": colors.secondary } : {}),
  };

  return (
    <div
      className="h-svh overflow-hidden bg-background text-foreground"
      style={colorVariables}
    >
      {topNavigation}
      <div className="flex h-[calc(100svh-3rem)] min-h-0">
        {sidebar ? (
          <div className="heyo-docs-enter heyo-docs-enter--navigation hidden min-h-0 w-60 shrink-0 lg:block xl:w-64">
            {sidebar}
          </div>
        ) : null}
        <ScrollArea
          className="min-h-0 min-w-0 flex-1"
          id={documentationScrollAreaId}
        >
          <main
            id="content"
            className="heyo-docs-enter heyo-docs-enter--content mx-auto min-h-full w-full max-w-[88rem] min-w-0 px-5 pt-8 pb-10 sm:px-8 lg:px-10 lg:pt-10 lg:pb-12 xl:pb-0"
          >
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
