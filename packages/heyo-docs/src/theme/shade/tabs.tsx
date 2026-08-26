import { DocsLink } from "../../components/docs-link";
import type { TabsProps } from "../../types";
import { navigationGroupContainsPath, navigationPages } from "../../navigation";

function firstPageHref(
  group: TabsProps["navigation"][number],
): string | undefined {
  return navigationPages(group.sections)[0]?.slug;
}

/** Group switcher presented as shadcn-style header tabs instead of a dropdown. */
export function ShadeNavigationTabs({ currentPath, navigation }: TabsProps) {
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
          "relative inline-flex h-8 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity",
          active
            ? "text-foreground after:opacity-100"
            : "text-muted-foreground hover:text-foreground",
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
