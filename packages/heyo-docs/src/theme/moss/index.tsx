import type { HeyoDocsTheme } from "../../types";
import { DocumentationBreadcrumb } from "../components/breadcrumb";
import { ChangelogPage } from "../components/changelog/page";
import { DocumentationPage } from "../components/documentation/page";
import { DocumentationTableOfContents } from "../components/documentation/toc";
import { OpenApiPage } from "../components/openapi/page";
import { MossLayout } from "./layout";
import { MossSearch } from "./search";
import { MossSidebar } from "./sidebar";
import { MossSidebarFooter } from "./sidebar-footer";
import { MossNavigationTabs } from "./tabs";
import { MossTopNavigation } from "./top-navigation";

/** A Mintlify-inspired documentation shell with a focused left sidebar. */
export const mossTheme: HeyoDocsTheme = {
  name: "moss",
  components: {
    Layout: MossLayout,
    TopNavigation: MossTopNavigation,
    Breadcrumb: DocumentationBreadcrumb,
    Sidebar: MossSidebar,
    DocsPage: DocumentationPage,
    ChangelogPage,
    OpenApiPage,
    TableOfContents: DocumentationTableOfContents,
    Tabs: MossNavigationTabs,
    Search: MossSearch,
    SidebarFooter: MossSidebarFooter,
  },
};
