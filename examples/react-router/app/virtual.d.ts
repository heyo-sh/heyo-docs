declare module "virtual:heyo-docs-content" {
  import type { DocsPage } from "@heyo-sh/heyo-docs";
  export const pages: DocsPage[];
}

declare module "virtual:heyo-docs-content/server" {
  import type { MarkdownPage } from "@heyo-sh/heyo-docs";
  export const pages: MarkdownPage[];
}

declare module "virtual:heyo-docs-openapi" {
  import type { OpenApiDocumentSource } from "@heyo-sh/heyo-docs";
  export const openApiDocuments: OpenApiDocumentSource[];
}

declare module "virtual:heyo-docs-openapi/index" {
  import type { OpenApiEndpoint } from "@heyo-sh/heyo-docs";
  export const openApiEndpoints: OpenApiEndpoint[];
}
