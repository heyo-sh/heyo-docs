import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import type { TabsProps } from "../../../types";
import { Icon } from "../../../components/icons";
import { DocsLink } from "../../../components/docs-link";
import {
  navigationGroupContainsPath,
  navigationPages,
} from "../../../navigation";

function firstPageHref(
  group: TabsProps["navigation"][number],
): string | undefined {
  return navigationPages(group.sections)[0]?.slug;
}

export function NavigationTabs({ currentPath, navigation }: TabsProps) {
  const currentGroup =
    navigation.find((group) =>
      navigationGroupContainsPath(group, currentPath),
    ) ?? navigation[0];
  const label = currentGroup?.group ?? "Documentation";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="flex h-10 w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground/60 transition-colors hover:bg-foreground/[0.03] hover:text-foreground/80 aria-expanded:bg-foreground/[0.03] aria-expanded:text-foreground/80"
            type="button"
          />
        }
      >
        <Icon className="size-4 shrink-0" name={currentGroup?.icon} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <Icon className="size-4 shrink-0" name="chevronDown" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-[calc(var(--anchor-width)-0.5rem)] p-0"
      >
        {navigation.map((group) => {
          const href = firstPageHref(group);
          return (
            <DropdownMenuItem
              aria-current={
                group.group === currentGroup?.group ? "page" : undefined
              }
              className="h-10 min-h-0 w-full rounded-none px-4 py-2.5 text-sm text-foreground/60 hover:bg-foreground/[0.03] hover:text-foreground/80 focus:bg-foreground/[0.03] focus:text-foreground/80 aria-current:bg-foreground/[0.03] aria-current:text-foreground/80"
              disabled={!href}
              key={group.group}
              render={href ? <DocsLink href={href} /> : undefined}
            >
              <Icon className="size-3.5" name={group.icon} />
              <span>{group.group}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
