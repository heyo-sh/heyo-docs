import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import { DocsLink } from "../../components/docs-link";
import { Icon } from "../../components/icons";
import { isNavigationSection, navigationPages } from "../../navigation";
import type {
  NavigationGroup,
  NavigationItem,
  NavigationPage,
  NavigationSection,
  SidebarProps,
} from "../../types";
import { OpenApiMethodBadge } from "../components/openapi/method-badge";
import { ChevronRightGlyph, ExternalGlyph } from "./glyphs";

type HeyoSidebarNavigationProps = Pick<
  SidebarProps,
  "navigation" | "currentPath"
>;

/**
 * A navigation row is content inside a group, not the name of one, so it stays
 * at normal weight until it is the current page. Hover and active share the
 * same translucent tint — solid fills here would make the sidebar read as a
 * stack of panels.
 */
const rowClassName =
  "group/row flex min-h-8 w-full min-w-0 items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-[background-color,color] duration-100 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring";

const subRowClassName =
  "group/row flex min-h-7 w-full min-w-0 items-center gap-2 rounded-md px-2.5 text-left text-sm transition-[background-color,color] duration-100 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring";

const idleRowClassName =
  "text-foreground/80 hover:bg-foreground/[0.055] hover:text-foreground";

const activeRowClassName = "bg-foreground/[0.06] font-medium text-foreground";

const panelClassName =
  "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-heyo data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none";

/**
 * The rail that ties a section's pages back to their heading. It starts under
 * the parent's icon, so the tree reads as one line rather than as indentation
 * you have to measure.
 */
const railClassName =
  "relative ml-[1.3125rem] pl-2.5 before:absolute before:inset-y-1 before:left-0 before:w-px before:bg-border";

function pageCount(section: NavigationSection): number {
  return navigationPages([section]).length;
}

function SectionTree({
  currentPath,
  depth,
  section,
}: {
  currentPath: string;
  depth: number;
  section: NavigationSection;
}) {
  const items = (
    <ul className="flex min-w-0 flex-col gap-px">
      {section.pages.map((item, index) => (
        <NavigationEntry
          currentPath={currentPath}
          depth={depth}
          item={item}
          key={
            isNavigationSection(item)
              ? `section-${item.section ?? "pages"}-${index}`
              : `page-${item.slug}-${index}`
          }
          nested={Boolean(section.section)}
        />
      ))}
    </ul>
  );

  // A page list without a heading is just pages: no disclosure, no rail.
  if (!section.section) return items;

  const count = pageCount(section);

  return (
    <Collapsible
      className="group/section min-w-0"
      defaultOpen={section.expanded}
    >
      <CollapsibleTrigger
        className={`${rowClassName} font-medium text-foreground/90 hover:bg-foreground/[0.055] hover:text-foreground`}
      >
        <Icon
          className="size-4 shrink-0 text-muted-foreground"
          name={section.icon}
        />
        <span className="min-w-0 flex-1 truncate">{section.section}</span>
        {count ? (
          <span className="inline-flex h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-sm border border-dashed border-border px-1 text-[0.6875rem] font-normal tabular-nums text-muted-foreground">
            {count}
          </span>
        ) : null}
        <ChevronRightGlyph className="size-3.5 shrink-0 text-muted-foreground opacity-60 transition-[rotate,opacity] duration-200 ease-heyo group-hover/section:opacity-100 group-data-[panel-open]/section:rotate-90 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent className={panelClassName}>
        <div className={`${railClassName} mt-px`}>{items}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function NavigationEntry({
  currentPath,
  depth,
  item,
  nested,
}: {
  currentPath: string;
  depth: number;
  item: NavigationItem;
  nested: boolean;
}) {
  if (isNavigationSection(item)) {
    return (
      <li className="min-w-0">
        <SectionTree
          currentPath={currentPath}
          depth={depth + 1}
          section={item}
        />
      </li>
    );
  }

  return (
    <NavigationPageItem currentPath={currentPath} nested={nested} page={item} />
  );
}

function NavigationPageItem({
  currentPath,
  nested,
  page,
}: {
  currentPath: string;
  nested: boolean;
  page: NavigationPage;
}) {
  const active = page.slug === currentPath;

  return (
    <li className="min-w-0">
      <DocsLink
        aria-current={active ? "page" : undefined}
        className={[
          nested ? subRowClassName : rowClassName,
          active
            ? activeRowClassName
            : nested
              ? "text-muted-foreground hover:bg-foreground/[0.055] hover:text-foreground"
              : idleRowClassName,
        ].join(" ")}
        href={page.slug}
      >
        {page.method ? (
          <span className="flex w-[2.8rem] shrink-0">
            <OpenApiMethodBadge method={page.method} />
          </span>
        ) : page.icon ? (
          <Icon
            className={`shrink-0 text-muted-foreground transition-colors group-hover/row:text-foreground ${
              nested ? "size-3.5" : "size-4"
            } ${active ? "text-foreground" : ""}`}
            name={page.icon}
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{page.title}</span>
      </DocsLink>
    </li>
  );
}

function GroupTree({
  currentPath,
  group,
}: {
  currentPath: string;
  group: NavigationGroup;
}) {
  return (
    <section
      className="flex min-w-0 flex-col gap-0.5"
      data-public={group.public}
    >
      {group.src ? (
        <DocsLink
          className={`${rowClassName} ${idleRowClassName}`}
          href={group.src}
        >
          <Icon
            className="size-4 shrink-0 text-muted-foreground"
            name={group.icon}
          />
          <span className="min-w-0 flex-1 truncate">{group.group}</span>
          <ExternalGlyph className="size-3.5 shrink-0 text-muted-foreground opacity-60" />
        </DocsLink>
      ) : null}
      {group.sections.map((section, index) => (
        <SectionTree
          currentPath={currentPath}
          depth={0}
          key={`${section.section ?? "pages"}-${index}`}
          section={section}
        />
      ))}
    </section>
  );
}

/** The page tree: collapsible sections, a guide rail per level, tinted rows. */
export function HeyoSidebarNavigation({
  navigation,
  currentPath,
}: HeyoSidebarNavigationProps) {
  return (
    <nav
      aria-label="Documentation navigation"
      className="flex min-w-0 flex-col gap-2 p-2"
    >
      {navigation.map((group) => (
        <GroupTree currentPath={currentPath} group={group} key={group.group} />
      ))}
    </nav>
  );
}
