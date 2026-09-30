import type { HeyoDocsTheme } from "../../types";
import { DocumentationBreadcrumb } from "../components/breadcrumb";
import { ChangelogPage } from "../components/changelog/page";
import { DocumentationPage } from "../components/documentation/page";
import { DocumentationTableOfContents } from "../components/documentation/toc";
import { OpenApiPage } from "../components/openapi/page";
import { HeyoLayout } from "./layout";
import { HeyoSearch } from "./search";
import { HeyoSidebar } from "./sidebar";
import { HeyoSidebarFooter } from "./sidebar-footer";
import { HeyoNavigationTabs } from "./tabs";
import { HeyoTopNavigation } from "./top-navigation";

/**
 * The heyo-ui console shell: a monochrome accent, hairline edges, a flat
 * sidebar that shares the page fill, and a dense 13/14px scale.
 *
 * Slot placement differs from the other bundled themes on purpose. Search and
 * the group switcher live in the sidebar head, the breadcrumb owns the header,
 * and colour mode is toggled from the header so it survives a closed drawer.
 */
export const heyoTheme: HeyoDocsTheme = {
  name: "heyo",
  components: {
    Layout: HeyoLayout,
    TopNavigation: HeyoTopNavigation,
    Breadcrumb: DocumentationBreadcrumb,
    Sidebar: HeyoSidebar,
    DocsPage: DocumentationPage,
    ChangelogPage,
    OpenApiPage,
    TableOfContents: DocumentationTableOfContents,
    Tabs: HeyoNavigationTabs,
    Search: HeyoSearch,
    SidebarFooter: HeyoSidebarFooter,
  },
};
