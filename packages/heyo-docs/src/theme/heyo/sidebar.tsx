import { ScrollArea } from "../../components/ui/scroll-area";
import type { SidebarProps } from "../../types";
import { HeyoChangelogNavigation } from "./changelog-navigation";
import { HeyoSidebarNavigation } from "./sidebar-navigation";

/**
 * The scrollbar is a hairline that only appears while the pane is moving. A
 * permanent one on a surface that shares the page fill reads as a seam.
 */
const scrollbarClassName = [
  "[&>[data-slot=scroll-area-scrollbar]]:pointer-events-none",
  "[&>[data-slot=scroll-area-scrollbar]]:w-1.5",
  "[&>[data-slot=scroll-area-scrollbar]]:border-l-0",
  "[&>[data-slot=scroll-area-scrollbar]]:opacity-0",
  "[&>[data-slot=scroll-area-scrollbar]]:transition-opacity",
  "[&>[data-slot=scroll-area-scrollbar]]:duration-150",
  "[&>[data-slot=scroll-area-scrollbar][data-scrolling]]:pointer-events-auto",
  "[&>[data-slot=scroll-area-scrollbar][data-scrolling]]:opacity-100",
  "[&>[data-slot=scroll-area-scrollbar][data-scrolling]]:duration-0",
].join(" ");

/**
 * The sidebar is not a panel: it shares the page background and a single
 * hairline separates it from the content. Search and the group switcher sit in
 * a fixed head, the tree scrolls, external links stay pinned to the bottom.
 */
export function HeyoSidebar({
  changelogUpdates,
  currentPath,
  footer,
  navigation,
  search,
  tabs,
}: SidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-1 flex-col bg-sidebar text-sidebar-foreground lg:border-r lg:border-border">
      {search || tabs ? (
        <div className="flex shrink-0 flex-col gap-2 border-b border-border p-2">
          {tabs}
          {search}
        </div>
      ) : null}
      <div className="min-h-0 flex-1">
        <ScrollArea className={`h-full ${scrollbarClassName}`}>
          {changelogUpdates ? (
            <HeyoChangelogNavigation updates={changelogUpdates} />
          ) : (
            <HeyoSidebarNavigation
              currentPath={currentPath}
              navigation={navigation}
            />
          )}
        </ScrollArea>
      </div>
      {footer}
    </aside>
  );
}
