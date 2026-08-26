import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible";
import type {
  NavigationGroup,
  NavigationItem,
  NavigationPage,
  NavigationSection,
  SidebarProps,
} from "../../../types";
import { Icon } from "../../../components/icons";
import { DocsLink } from "../../../components/docs-link";
import { isNavigationSection } from "../../../navigation";
import { OpenApiMethodBadge } from "../openapi/method-badge";

type SidebarNavigationProps = Pick<SidebarProps, "navigation" | "currentPath">;

function NavigationSection({
  currentPath,
  depth = 0,
  section,
}: {
  currentPath: string;
  depth?: number;
  section: NavigationSection;
}) {
  if (!section.section) {
    return (
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
  }

  const sectionIndentation =
    depth === 0 ? undefined : { paddingLeft: `${1 + depth * 0.75}rem` };

  return (
    <Collapsible className="group/navigation" defaultOpen={section.expanded}>
      <CollapsibleTrigger
        className="flex h-10 w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground/60 transition-colors hover:bg-foreground/[0.03] hover:text-foreground/80"
        style={sectionIndentation}
      >
        <Icon className="size-4 shrink-0" name={section.icon} />
        <span className="min-w-0 flex-1 truncate">{section.section}</span>
        <Icon
          className="size-4 shrink-0 transition-transform duration-200 group-data-[panel-open]/navigation:rotate-180"
          name="chevronDown"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul>
          {section.pages.map((item, index) => (
            <NavigationItem
              currentPath={currentPath}
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
      </CollapsibleContent>
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
    paddingLeft: `${(direct ? 1 : 2.5) + depth * 0.75}rem`,
  };

  return (
    <li>
      <PageLink
        aria-current={active ? "page" : undefined}
        className={`relative flex w-full items-center gap-2 px-4 py-1.5 text-sm transition-colors ${
          active
            ? "bg-foreground/[0.03] text-foreground/90"
            : "text-foreground/65 hover:bg-foreground/[0.03] hover:text-foreground/90"
        }`}
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
    <section
      className="border-b border-foreground/[0.06]"
      data-public={group.public}
    >
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

/** Internal page tree for the fixed left sidebar. */
export function SidebarNavigation({
  navigation,
  currentPath,
}: SidebarNavigationProps) {
  return (
    <nav aria-label="Documentation navigation">
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
