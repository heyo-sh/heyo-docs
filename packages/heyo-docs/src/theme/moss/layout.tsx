import type { CSSProperties } from "react";

import type { LayoutProps } from "../../types";

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
      className="min-h-svh bg-background text-foreground"
      style={colorVariables}
    >
      {topNavigation}
      <div className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-[1600px] lg:grid-cols-[minmax(16rem,17.5rem)_minmax(0,1fr)]">
        {sidebar ? (
          <div className="hidden lg:block heyo-docs-enter heyo-docs-enter--navigation">
            {sidebar}
          </div>
        ) : null}
        <main
          id="content"
          className="heyo-docs-enter heyo-docs-enter--content min-w-0 px-6 py-10 sm:px-10 lg:px-14 lg:py-14"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
