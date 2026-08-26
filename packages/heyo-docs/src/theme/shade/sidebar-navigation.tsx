import { DocsLink } from "../../components/docs-link";
import { Icon } from "../../components/icons";
import { Button } from "../../components/ui/button";
import { isNavigationSection } from "../../navigation";
import type {
  NavigationGroup,
  NavigationItem,
  NavigationPage,
  NavigationSection,
  SidebarProps,
} from "../../types";
import { OpenApiMethodBadge } from "../components/openapi/method-badge";

type ShadeSidebarNavigationProps = Pick<
  SidebarProps,
  "navigation" | "currentPath"
>;

function NavigationSection({
  currentPath,
  section,
}: {
  currentPath: string;
  section: NavigationSection;
}) {
  const pages = (
    <ul className="space-y-0.5">
      {section.pages.map((item, index) => (
        <NavigationItem
          currentPath={currentPath}
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

  return (
    <section className="my-4">
      <p className="mb-1 px-2 text-xs text-muted-foreground">
        {section.section}
      </p>
      {pages}
    </section>
  );
}

function NavigationItem({
  currentPath,
  item,
}: {
  currentPath: string;
  item: NavigationItem;
}) {
  if (isNavigationSection(item)) {
    return (
      <li>
        <NavigationSection currentPath={currentPath} section={item} />
      </li>
    );
  }

  return <NavigationPageItem currentPath={currentPath} page={item} />;
}

function NavigationPageItem({
  currentPath,
  page,
}: {
  currentPath: string;
  page: NavigationPage;
}) {
  const active = !page.link && page.slug === currentPath;

  return (
    <li>
      <Button
        aria-current={active ? "page" : undefined}
        className="hover:bg-secondary hover:text-secondary-foreground"
        nativeButton={false}
        render={
          page.link ? <a href={page.slug} /> : <DocsLink href={page.slug} />
        }
        variant={active ? "secondary" : "ghost"}
      >
        {page.method ? <OpenApiMethodBadge method={page.method} /> : null}
        {page.icon ? <Icon name={page.icon} /> : null}
        <span>{page.title}</span>
      </Button>
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
    <section className="p-3" data-public={group.public}>
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

/** Native shadcn controls arranged as a fixed left-hand navigation. */
export function ShadeSidebarNavigation({
  navigation,
  currentPath,
}: ShadeSidebarNavigationProps) {
  return (
    <nav aria-label="Documentation navigation" className="my-10">
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
