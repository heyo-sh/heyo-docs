import type { HeyoDocsTheme } from "../../types";
import { DocumentationBreadcrumb } from "../components/breadcrumb";
import { ChangelogPage } from "../components/changelog/page";
import { DocumentationPage } from "../components/documentation/page";
import { DocumentationTableOfContents } from "../components/documentation/toc";
import { OpenApiPage } from "../components/openapi/page";
import { ShadeLayout } from "./layout";
import { ShadeSidebar } from "./sidebar";
import { ShadeSidebarFooter } from "./sidebar-footer";
import { ShadeSearch } from "./search";
import { ShadeNavigationTabs } from "./tabs";
import { ShadeTopNavigation } from "./top-navigation";

/** The shadcn/ui-inspired documentation shell. */
export const shadeTheme: HeyoDocsTheme = {
  name: "shade",
  components: {
    Layout: ShadeLayout,
    TopNavigation: ShadeTopNavigation,
    Breadcrumb: DocumentationBreadcrumb,
    Sidebar: ShadeSidebar,
    DocsPage: DocumentationPage,
    ChangelogPage,
    OpenApiPage,
    TableOfContents: DocumentationTableOfContents,
    Tabs: ShadeNavigationTabs,
    Search: ShadeSearch,
    SidebarFooter: ShadeSidebarFooter,
  },
};
