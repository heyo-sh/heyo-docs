import type { HeyoDocsTheme } from "../../types";
import { DocumentationBreadcrumb } from "../components/breadcrumb";
import { ChangelogPage } from "../components/changelog/page";
import { DocumentationPage } from "../components/documentation/page";
import { DocumentationTableOfContents } from "../components/documentation/toc";
import { SidebarFooter } from "../components/sidebar-footer";
import { DocumentationSearch } from "../components/search";
import { NavigationTabs } from "../components/navigation/tabs";
import { OpenApiPage } from "../components/openapi/page";
import { GrainLayout } from "./layout";
import { GrainSidebar } from "./sidebar";
import { GrainTopNavigation } from "./top-navigation";

/** The complete set of visual components that make up the Grain theme. */
export const grainTheme: HeyoDocsTheme = {
  name: "grain",
  components: {
    Layout: GrainLayout,
    TopNavigation: GrainTopNavigation,
    Breadcrumb: DocumentationBreadcrumb,
    Sidebar: GrainSidebar,
    DocsPage: DocumentationPage,
    ChangelogPage,
    OpenApiPage,
    TableOfContents: DocumentationTableOfContents,
    Tabs: NavigationTabs,
    Search: DocumentationSearch,
    SidebarFooter,
  },
};
