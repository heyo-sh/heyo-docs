import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible";
import { DocsLink } from "../../components/docs-link";
import { Icon } from "../../components/icons";
import { isNavigationSection } from "../../navigation";
import type {
  NavigationGroup,
  NavigationItem,
  NavigationPage,
  NavigationSection,
  SidebarProps,
} from "../../types";
import { OpenApiMethodBadge } from "../components/openapi/method-badge";

type MossSidebarNavigationProps = Pick<
  SidebarProps,
  "navigation" | "currentPath"
>;

function NavigationSection({
  currentPath,
  depth = 0,
  section,
}: {
  currentPath: string;
  depth?: number;
  section: NavigationSection;
}) {
  const pages = (
    <ul>
      {section.pages.map((item, index) => (
        <NavigationItem
          currentPath={currentPath}
          direct={depth === 0}
          depth={depth}
          item={item}
          key={
            isNavigationSection(item)
              ? `section-${item.section ?? "pages"}-${index}`
              : `${item.link ? "link" : "page"}-${item.slug}-${index}`
          }
        />
      ))}
    </ul>
  );

  if (!section.section) return pages;

  const sectionIndentation =
    depth === 0 ? undefined : { paddingLeft: `${1 + depth * 0.75}rem` };

  return (
    <Collapsible className="group/navigation" defaultOpen={section.expanded}>
      <CollapsibleTrigger
        className="flex h-9 w-full items-center gap-2 px-4 text-left text-xs font-semibold tracking-wide text-foreground/75 transition-colors hover:text-foreground"
        style={sectionIndentation}
      >
        <Icon className="size-3.5 shrink-0" name={section.icon} />
        <span className="min-w-0 flex-1 truncate">{section.section}</span>
        <Icon
          className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]/navigation:rotate-180"
          name="chevronDown"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>{pages}</CollapsibleContent>
    </Collapsible>
  );
}

function NavigationItem({
  currentPath,
  direct = false,
  depth,
  item,
}: {
  currentPath: string;
  direct?: boolean;
  depth: number;
  item: NavigationItem;
}) {
  if (isNavigationSection(item)) {
    return (
      <li>
        <NavigationSection
          currentPath={currentPath}
          depth={depth + 1}
          section={item}
        />
      </li>
    );
  }

  return (
    <NavigationPageItem
      currentPath={currentPath}
      direct={direct}
      depth={depth}
      page={item}
    />
  );
}

function NavigationPageItem({
  currentPath,
  direct,
  depth,
  page,
}: {
  currentPath: string;
  direct: boolean;
  depth: number;
  page: NavigationPage;
}) {
  const active = !page.link && page.slug === currentPath;
  const PageLink = page.link ? "a" : DocsLink;
  const pageIndentation = {
    paddingLeft: `${(direct ? 1 : 2.25) + depth * 0.75}rem`,
  };

  return (
    <li>
      <PageLink
        aria-current={active ? "page" : undefined}
        className={[
          "relative flex min-h-9 w-full items-center gap-2 px-4 py-1.5 text-sm transition-colors",
          active
            ? "font-medium text-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-r-full before:bg-primary"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        ].join(" ")}
        href={page.slug}
        style={pageIndentation}
      >
        {page.method ? (
          <span className="flex w-[2.8rem] shrink-0">
            <OpenApiMethodBadge method={page.method} />
          </span>
        ) : page.icon ? (
          <Icon className="size-4 shrink-0" name={page.icon} />
        ) : null}
        <span className="min-w-0 truncate">{page.title}</span>
      </PageLink>
    </li>
  );
}

function NavigationGroup({
  currentPath,
  group,
}: {
  currentPath: string;
  group: NavigationGroup;
}) {
  return (
    <section className="py-2" data-public={group.public}>
      {group.sections.map((section, index) => (
        <NavigationSection
          currentPath={currentPath}
          key={`${section.section ?? "pages"}-${index}`}
          section={section}
        />
      ))}
    </section>
  );
}

/** Compact section tree for Moss' persistent left-hand navigation. */
export function MossSidebarNavigation({
  navigation,
  currentPath,
}: MossSidebarNavigationProps) {
  return (
    <nav aria-label="Documentation navigation" className="px-1 py-3">
      {navigation.map((group) => (
        <NavigationGroup
          currentPath={currentPath}
          group={group}
          key={group.group}
        />
      ))}
    </nav>
  );
}
