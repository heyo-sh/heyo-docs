import { DocsLink } from "../../components/docs-link";
import { Icon } from "../../components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { navigationGroupContainsPath, navigationPages } from "../../navigation";
import type { TabsProps } from "../../types";
import { CheckGlyph, ChevronDownGlyph } from "./glyphs";

function firstPageHref(
  group: TabsProps["navigation"][number],
): string | undefined {
  return group.src ?? navigationPages(group.sections)[0]?.slug;
}

/**
 * The group switcher, shaped like heyo-ui's `Select`: a control at the top of
 * the sidebar that names the context you are in and swaps it.
 *
 * Not header tabs, and not a segmented track. Both need room proportional to
 * the number of groups, and a 15rem rail does not have it — the third tab
 * starts truncating at "Documentation / API reference / Changelog", which is
 * the most ordinary set of groups there is. A control that fits any number of
 * options in the same 32px is the honest answer.
 *
 * A single group renders nothing: a switcher with one option is a label that
 * costs a row of navigation.
 */
export function HeyoNavigationTabs({ currentPath, navigation }: TabsProps) {
  if (navigation.length < 2) return null;

  const currentGroup =
    navigation.find((group) =>
      navigationGroupContainsPath(group, currentPath),
    ) ?? navigation[0];

  if (!currentGroup) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Documentation groups"
        className="flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg bg-card px-2.5 text-sm font-medium text-foreground shadow-xs ring-1 ring-border transition-colors duration-100 hover:bg-muted focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring aria-expanded:bg-muted"
      >
        <Icon
          className="size-4 shrink-0 text-muted-foreground"
          name={currentGroup.icon}
        />
        <span className="min-w-0 flex-1 truncate text-left">
          {currentGroup.group}
        </span>
        <ChevronDownGlyph className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--anchor-width)">
        {navigation.map((group) => {
          const href = firstPageHref(group);
          const GroupLink = group.src ? "a" : DocsLink;
          const active = group.group === currentGroup.group;

          return (
            <DropdownMenuItem
              aria-current={active ? "page" : undefined}
              className="min-h-7 gap-2 rounded-md px-2 text-sm text-foreground/85 data-highlighted:bg-foreground/[0.055] data-highlighted:text-foreground"
              disabled={!href}
              key={group.group}
              render={href ? <GroupLink href={href} /> : undefined}
            >
              <Icon
                className="size-3.5 shrink-0 text-muted-foreground"
                name={group.icon}
              />
              <span className="min-w-0 flex-1 truncate">{group.group}</span>
              {active ? (
                <CheckGlyph className="size-3.5 shrink-0 text-foreground" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
