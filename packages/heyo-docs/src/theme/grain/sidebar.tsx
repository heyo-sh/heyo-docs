import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import type { SidebarProps } from "../../types";
import { ChangelogTableOfContents } from "../components/changelog/toc";
import { SidebarNavigation } from "../components/navigation/sidebar-navigation";

const documentationScrollbarClassName = [
  "[&>[data-slot=scroll-area-scrollbar]]:pointer-events-none",
  "[&>[data-slot=scroll-area-scrollbar]]:opacity-0",
  "[&>[data-slot=scroll-area-scrollbar]]:transition-opacity",
  "[&>[data-slot=scroll-area-scrollbar]]:duration-150",
  "[&>[data-slot=scroll-area-scrollbar][data-scrolling]]:pointer-events-auto",
  "[&>[data-slot=scroll-area-scrollbar][data-scrolling]]:opacity-100",
  "[&>[data-slot=scroll-area-scrollbar][data-scrolling]]:duration-0",
].join(" ");

export function GrainSidebar({
  changelogUpdates,
  footer,
  navigation,
  currentPath,
  search,
  tabs,
}: SidebarProps) {
  return (
    <aside className="flex min-h-80 flex-1 flex-col border-b border-foreground/5 bg-background lg:sticky lg:top-14 lg:h-[calc(100svh-3.5rem)] lg:min-h-0 lg:border-r lg:border-b-0">
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-foreground/5">
        <div>{tabs}</div>
        <div>{search}</div>
        <ScrollArea
          className={`min-h-0 flex-1 ${
            changelogUpdates
              ? "[&>[data-slot=scroll-area-scrollbar]]:hidden"
              : documentationScrollbarClassName
          }`}
        >
          {changelogUpdates ? (
            <ChangelogTableOfContents updates={changelogUpdates} />
          ) : (
            <SidebarNavigation
              currentPath={currentPath}
              navigation={navigation}
            />
          )}
        </ScrollArea>
      </div>
      <Separator className="bg-foreground/5" />
      {footer}
    </aside>
  );
}
