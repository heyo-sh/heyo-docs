import { DocsLink } from "../../components/docs-link";
import { navigationGroupContainsPath, navigationPages } from "../../navigation";
import type { TabsProps } from "../../types";

function firstPageHref(
  group: TabsProps["navigation"][number],
): string | undefined {
  return navigationPages(group.sections)[0]?.slug;
}

/** Group navigation presented as centered horizontal header tabs. */
export function MossNavigationTabs({ currentPath, navigation }: TabsProps) {
  const currentGroup =
    navigation.find((group) =>
      navigationGroupContainsPath(group, currentPath),
    ) ?? navigation[0];

  if (!currentGroup) return null;

  return (
    <nav aria-label="Documentation groups" className="flex items-center gap-1">
      {navigation.map((group) => {
        const href = firstPageHref(group);
        const active = group.group === currentGroup.group;
        const className = [
          "relative inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          !href ? "pointer-events-none opacity-50" : "",
        ].join(" ");

        return href ? (
          <DocsLink
            aria-current={active ? "page" : undefined}
            className={className}
            href={href}
            key={group.group}
          >
            {group.group}
          </DocsLink>
        ) : (
          <span aria-disabled="true" className={className} key={group.group}>
            {group.group}
          </span>
        );
      })}
    </nav>
  );
}
