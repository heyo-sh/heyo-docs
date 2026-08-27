import type { ComponentProps, ComponentType, ReactNode } from "react";

import type { BuiltInThemeName } from "./theme/names";
import type { DocsLinkComponent } from "./components/docs-link";

export interface BrandingConfig {
  name: string;
  logo?: string;
}

export interface DocsColors {
  primary?: string;
  secondary?: string;
}

export interface FooterConfig {
  github?: string;
  website?: string;
}

export type DocsMode = "system" | "light" | "dark";

/** Names used by Heyo Docs' built-in UI and MDX components. */
export type SemanticIcon =
  | "book"
  | "changelog"
  | "code"
  | "file"
  | "github"
  | "globe"
  | "signIn"
  | "chevronDown"
  | "chevronRight"
  | "arrowDown"
  | "arrowUp"
  | "arrowRight"
  | "close"
  | "cornerDownLeft"
  | "menu"
  | "search"
  | "sun"
  | "moon"
  | "checkCircle"
  | "check"
  | "closeCircle"
  | "externalLink"
  | "folder"
  | "gitFork"
  | "gitRepository"
  | "information"
  | "lightbulb"
  | "copy"
  | "star"
  | "bot"
  | "cursor"
  | "chat";

export type IconProps = Omit<ComponentProps<"svg">, "children">;
export type IconComponent = ComponentType<IconProps>;

/**
 * Application-owned React components made available to every rendered MDX
 * document. Component names match the JSX tags used in MDX.
 */
export type MdxComponents = Record<string, ComponentType<any>>;

/**
 * Statically supplied icons for the built-in UI. Templates should provide one
 * icon set so applications never bundle icon packs they did not select.
 */
export type IconSet = Partial<Record<SemanticIcon, IconComponent>>;

export interface DocumentationSection {
  /**
   * Optional sidebar heading. Omit it to render this page list directly,
   * without a section heading or collapsible control.
   */
  section?: string;
  icon?: string;
  expanded: boolean;
  pages: DocumentationPageReference[];
}

/** A custom destination displayed alongside configured MDX pages. */
export interface DocumentationPageLink {
  title: string;
  src: string;
  /** Optional semantic icon displayed before the link title in the sidebar. */
  icon?: string;
}

/** An MDX page/directory reference that displays a required sidebar icon. */
export interface DocumentationPageReferenceWithIcon {
  page: string;
  icon: string;
}

/** An MDX page/directory reference, custom sidebar link, or nested section. */
export type DocumentationPageReference =
  | string
  | DocumentationPageLink
  | DocumentationPageReferenceWithIcon
  | DocumentationSection;

/** A section that generates endpoint pages from an OpenAPI document. */
export interface OpenApiSection {
  schema: string;
}

export type DocsSection = DocumentationSection | OpenApiSection;

export interface DocumentationGroupConfig {
  type: "documentation";
  group: string;
  icon?: string;
  public: boolean;
  sections: DocsSection[];
}

export interface ChangelogGroupConfig {
  type: "changelog";
  group: string;
  description?: string;
  icon?: string;
  public: boolean;
  updates: string[];
}

export type DocsGroupConfig = DocumentationGroupConfig | ChangelogGroupConfig;

export interface SeoData {
  title: string;
  description: string;
  canonical?: string;
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  depth: 2 | 3;
}

/** Metadata collected from an MDX `<Update>` component on a changelog page. */
export interface ChangelogUpdate {
  id: string;
  label: string;
  tags: string[];
}

/** A changelog update expanded with its RSS-ready source details. */
export interface ChangelogEntry extends ChangelogUpdate {
  /** Optional ISO 8601 publication date supplied as `<Update date="…">`. */
  date?: string;
  /** Plain-text body extracted from the MDX update component. */
  description: string;
}

export interface DocsPage {
  slug: string;
  title: string;
  description: string;
  content: ComponentType<{ components?: MdxComponents }>;
  tableOfContents: TableOfContentsItem[];
  seo: SeoData;
  sourcePath?: string;
  /** Plain text derived from the MDX source and used by local search. */
  searchContent?: string;
  /** Changelog entry metadata derived from MDX `<Update>` components. */
  changelogUpdates?: ChangelogUpdate[];
}

/** Minimal document shape indexed by the built-in client-side search. */
export interface SearchDocument {
  slug: string;
  title: string;
  description: string;
  tableOfContents?: TableOfContentsItem[];
  searchContent?: string;
}

export type OpenApiHttpMethod =
  "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

/** JSON-compatible OpenAPI document data emitted by the Vite plugin. */
export interface OpenApiDocument {
  openapi?: string;
  info?: Record<string, unknown>;
  servers?: Array<Record<string, unknown>>;
  security?: unknown[];
  paths: Record<string, unknown>;
  components?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface OpenApiDocumentSource {
  /** Index of the matching group in `heyo-docs.config.ts`. */
  groupIndex: number;
  /** Index of the matching `{ schema }` section. */
  sectionIndex: number;
  schema: string;
  document: OpenApiDocument;
}

export interface OpenApiSchema {
  $ref?: string;
  title?: string;
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  enum?: unknown[];
  example?: unknown;
  default?: unknown;
  [key: string]: unknown;
}

export interface OpenApiParameter {
  name: string;
  in: string;
  description?: string;
  required: boolean;
  deprecated: boolean;
  example?: unknown;
  schema?: OpenApiSchema;
}

export interface OpenApiRequestBody {
  contentType: string;
  description?: string;
  required: boolean;
  example?: unknown;
  schema?: OpenApiSchema;
}

export interface OpenApiResponse {
  status: string;
  description?: string;
  contentType?: string;
  example?: unknown;
  schema?: OpenApiSchema;
}

export interface OpenApiEndpoint {
  groupIndex: number;
  sectionIndex: number;
  slug: string;
  method: OpenApiHttpMethod;
  path: string;
  title: string;
  description?: string;
  summary?: string;
  operationId?: string;
  tags: string[];
  parameters: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: OpenApiResponse[];
  security: unknown[];
  servers: string[];
  securitySchemes: Record<string, unknown>;
  /**
   * The source document used to resolve schema references on an endpoint page.
   * Navigation and search only need the endpoint index, so adapters may omit it
   * until the matching endpoint is rendered.
   */
  document?: OpenApiDocument;
}

export interface ScannedPage {
  slug: string;
  title: string;
  description: string;
  sourcePath: string;
  raw: string;
  tableOfContents: TableOfContentsItem[];
  changelogUpdates: ChangelogUpdate[];
}

/** Server-only source data generated by the Vite plugin for LLM endpoints. */
export interface MarkdownPage {
  slug: string;
  title: string;
  description: string;
  raw: string;
  /** Content-relative path used to associate a page with a changelog group. */
  sourcePath?: string;
}

export interface NavigationNode {
  title: string;
  path?: string;
  children: NavigationNode[];
}

export interface NavigationSection {
  /** Omitted for a page list that is intentionally not shown as a section. */
  section?: string;
  icon?: string;
  expanded: boolean;
  pages: NavigationItem[];
}

export interface NavigationPage {
  slug: string;
  title: string;
  /** Optional semantic icon configured for an individual documentation page. */
  icon?: string;
  /** Present only for generated OpenAPI endpoint navigation entries. */
  method?: OpenApiHttpMethod;
  /** True when this entry is a configured link rather than a documentation page. */
  link?: boolean;
}

/** A navigation section can appear alongside page links at any depth. */
export type NavigationItem = NavigationPage | NavigationSection;

export interface NavigationGroup {
  group: string;
  icon?: string;
  public: boolean;
  sections: NavigationSection[];
}

export interface DocsModel {
  pages: DocsPage[];
  navigation: NavigationGroup[];
  endpoints: OpenApiEndpoint[];
}

export interface LayoutProps {
  children: ReactNode;
  /** A theme-owned header, omitted by themes that do not need one. */
  topNavigation?: ReactNode;
  /** A theme-owned navigation area, omitted by themes without a sidebar. */
  sidebar?: ReactNode;
  colors: DocsColors;
}

/**
 * The area above the documentation shell. A theme can arrange the breadcrumb
 * and header actions however it needs.
 */
export interface TopNavigationProps {
  branding: BrandingConfig;
  /** Application-owned JSX rendered in the theme's navigation slot. */
  navigation?: ReactNode;
  /** Omitted when the active theme does not implement breadcrumbs. */
  breadcrumb?: ReactNode;
  /** Omitted when the active theme does not expose group tabs in its header. */
  tabs?: ReactNode;
  /** A theme may render search in the header, sidebar, or neither. */
  search?: ReactNode;
  /** Optional compact navigation control for small viewports. */
  mobileNavigation?: ReactNode;
  /** Theme state supplied by the rendering framework. */
  isDark?: boolean;
  /** Theme update handler supplied by the rendering framework. */
  onThemeToggle?: () => void;
}

export interface BreadcrumbProps {
  label: string;
  /** Ordered ancestors ending with the current page. */
  items?: Array<{
    label: string;
    href?: string;
  }>;
}

export interface SidebarProps {
  navigation: NavigationGroup[];
  currentPath: string;
  /** Omitted when the active theme does not expose group tabs. */
  tabs?: ReactNode;
  /** Omitted when the active theme does not expose local search. */
  search?: ReactNode;
  /** Omitted when the active theme does not expose a sidebar footer. */
  footer?: ReactNode;
  /** Update labels replace section navigation for a changelog group. */
  changelogUpdates?: ChangelogUpdate[];
}

export interface SidebarFooterProps {
  footer: FooterConfig;
  /** Theme state supplied by the rendering framework. */
  isDark?: boolean;
  /** Theme update handler supplied by the rendering framework. */
  onThemeToggle?: () => void;
}

export interface DocsPageProps {
  page: DocsPage;
  previous?: PageNavigationItem;
  next?: PageNavigationItem;
  tableOfContents: ReactNode;
  /** Application-owned components injected into the page's MDX content. */
  mdxComponents?: MdxComponents;
}

export interface ChangelogPageProps {
  page: DocsPage;
  group: ChangelogGroupConfig;
  /** Application-owned components injected into the changelog's MDX content. */
  mdxComponents?: MdxComponents;
}

export interface OpenApiPageProps {
  endpoint: OpenApiEndpoint;
  previous?: PageNavigationItem;
  next?: PageNavigationItem;
  /** Optional same-origin endpoint used to send OpenAPI requests server-side. */
  openApiRequestUrl?: string;
}

export interface PageNavigationItem {
  href: string;
  title: string;
}

export interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

export interface SearchProps {
  pages: SearchDocument[];
}

export interface TabsProps {
  /** All groups available to the left-hand group switcher. */
  navigation: NavigationGroup[];
  /** Context for themes that need to distinguish page kinds in the switcher. */
  navigationType: "documentation" | "changelog" | "openapi";
  currentPath: string;
}

export interface HeyoDocsThemeComponents {
  Layout: ComponentType<LayoutProps>;
  /** Optional chrome lets a theme omit or relocate standard controls. */
  TopNavigation?: ComponentType<TopNavigationProps>;
  Breadcrumb?: ComponentType<BreadcrumbProps>;
  Sidebar?: ComponentType<SidebarProps>;
  DocsPage: ComponentType<DocsPageProps>;
  ChangelogPage: ComponentType<ChangelogPageProps>;
  OpenApiPage: ComponentType<OpenApiPageProps>;
  TableOfContents?: ComponentType<TableOfContentsProps>;
  Tabs?: ComponentType<TabsProps>;
  Search?: ComponentType<SearchProps>;
  SidebarFooter?: ComponentType<SidebarFooterProps>;
}

export interface HeyoDocsTheme {
  name: BuiltInThemeName;
  components: HeyoDocsThemeComponents;
}

export interface DocsAppProps {
  config: HeyoDocsConfig;
  /** Statically imported icon set owned by the application template. */
  iconSet?: IconSet;
  pages: DocsPage[];
  /** Schemas emitted by the Vite plugin. Omit when an app has no OpenAPI group. */
  openApiDocuments?: OpenApiDocumentSource[];
  /**
   * A precomputed, document-free endpoint index. This keeps large schemas out
   * of client entry chunks in server-rendered framework adapters.
   */
  openApiEndpoints?: OpenApiEndpoint[];
  /** Full endpoint data for the currently rendered OpenAPI route. */
  currentOpenApiEndpoint?: OpenApiEndpoint;
  /** Optional same-origin endpoint used to send OpenAPI requests server-side. */
  openApiRequestUrl?: string;
  /**
   * Application-owned React components registered for every MDX documentation
   * and changelog page. Keys are the JSX tag names used in MDX.
   */
  mdxComponents?: MdxComponents;
  /**
   * Replaces selected components from the configured theme while preserving
   * the rest of its documentation shell.
   */
  themeComponents?: Partial<HeyoDocsThemeComponents>;
  /**
   * Optional adapter for the application's client-side router. It is used for
   * internal documentation navigation; external links remain regular anchors.
   */
  link?: DocsLinkComponent;
  pathname: string;
  isDark?: boolean;
  onThemeToggle?: () => void;
}

export interface HeyoDocsConfig {
  title: string;
  description: string;
  theme: BuiltInThemeName;
  colors: DocsColors;
  /** Application-owned JSX placed by the active theme. */
  navigation?: ReactNode;
  groups: DocsGroupConfig[];
  footer: FooterConfig;
  mode: DocsMode;
  /**
   * Directory containing MDX pages and local API schemas, relative to the
   * application root. Both "./content" and "content" are supported.
   */
  content: string;
  branding: BrandingConfig;
  siteUrl?: string;
}

export interface UserDocumentationSection {
  /** Omit to place `pages` directly in the group, without a sidebar section. */
  section?: string;
  icon?: string;
  expanded?: boolean;
  pages?: UserDocumentationPageReference[];
}

/** Config-input variant of a recursively nested documentation section. */
export type UserDocumentationPageReference =
  | string
  | DocumentationPageLink
  | DocumentationPageReferenceWithIcon
  | UserDocumentationSection;

export interface UserOpenApiSection {
  schema: string;
}

export type UserDocsSection = UserDocumentationSection | UserOpenApiSection;

export interface UserDocumentationGroup {
  type?: "documentation";
  group: string;
  icon?: string;
  public?: boolean;
  sections?: UserDocsSection[];
}

export interface UserChangelogGroup {
  type: "changelog";
  group: string;
  description?: string;
  icon?: string;
  public?: boolean;
  updates: string[];
}

export type UserDocsGroup = UserDocumentationGroup | UserChangelogGroup;

export interface UserHeyoDocsConfig {
  title?: string;
  description?: string;
  theme?: BuiltInThemeName;
  colors?: DocsColors;
  /** Application-owned JSX placed by the active theme. */
  navigation?: ReactNode;
  groups?: UserDocsGroup[];
  footer?: FooterConfig;
  mode?: DocsMode;
  /**
   * Directory containing MDX pages and local API schemas, relative to the
   * application root. Both "./content" and "content" are supported.
   */
  content: string;
  branding?: Partial<BrandingConfig>;
  siteUrl?: string;
}
