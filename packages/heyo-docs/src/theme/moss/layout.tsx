import type { CSSProperties } from "react";

import { ScrollArea } from "../../components/ui/scroll-area";
import type { LayoutProps } from "../../types";
import { documentationScrollAreaId } from "../components/documentation/scroll";

export function MossLayout({
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
      <div className="mx-auto grid h-[calc(100svh-3.5rem)] min-h-0 max-w-[1600px] lg:grid-cols-[minmax(16rem,17.5rem)_minmax(0,1fr)]">
        {sidebar ? (
          <div className="hidden min-h-0 lg:block heyo-docs-enter heyo-docs-enter--navigation">
            {sidebar}
          </div>
        ) : null}
        <ScrollArea className="min-h-0 min-w-0" id={documentationScrollAreaId}>
          <main
            id="content"
            className="heyo-docs-enter heyo-docs-enter--content min-h-full min-w-0 px-6 pb-10 pt-10 sm:px-10 lg:px-14 lg:pb-14 lg:pt-14 xl:pb-0"
          >
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
