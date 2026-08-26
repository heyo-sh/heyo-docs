import { ScrollArea } from "../../components/ui/scroll-area";
import type { SidebarProps } from "../../types";
import { ShadeChangelogNavigation } from "./changelog-navigation";
import { ShadeSidebarNavigation } from "./sidebar-navigation";

export function ShadeSidebar({
  changelogUpdates,
  footer,
  navigation,
  currentPath,
}: SidebarProps) {
  return (
    <aside className="relative flex min-h-80 flex-1 flex-col border-b border-border lg:sticky lg:top-14 lg:h-[calc(100svh-3.5rem)] lg:min-h-0 lg:border-b-0">
      <div className="relative min-h-0 flex-1">
        <ScrollArea className="h-full [&>[data-slot=scroll-area-scrollbar]]:hidden">
          {changelogUpdates ? (
            <ShadeChangelogNavigation updates={changelogUpdates} />
          ) : (
            <ShadeSidebarNavigation
              currentPath={currentPath}
              navigation={navigation}
            />
          )}
        </ScrollArea>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-background via-background/80 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-background via-background/80 to-transparent"
        />
      </div>
      {footer}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-border/0 via-border to-border/0 lg:block"
      />
    </aside>
  );
}
