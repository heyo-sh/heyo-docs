import { ScrollArea } from "../../components/ui/scroll-area";
import type { SidebarProps } from "../../types";
import { ChangelogTableOfContents } from "../components/changelog/toc";
import { MossSidebarNavigation } from "./sidebar-navigation";

export function MossSidebar({
  changelogUpdates,
  currentPath,
  footer,
  navigation,
  search,
}: SidebarProps) {
  return (
    <aside className="flex min-h-80 flex-1 flex-col border-r border-border bg-background lg:sticky lg:top-14 lg:h-[calc(100svh-3.5rem)] lg:min-h-0">
      {search ? <div className="px-4 py-4">{search}</div> : null}
      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full [&>[data-slot=scroll-area-scrollbar]]:hidden">
          {changelogUpdates ? (
            <ChangelogTableOfContents updates={changelogUpdates} />
          ) : (
            <MossSidebarNavigation
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
