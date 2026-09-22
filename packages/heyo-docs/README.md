# Heyo Docs

The themeable documentation runtime behind Heyo Docs sites. It provides MDX content, navigation, search, OpenAPI reference pages, and SEO utilities for React Router, Next.js, and Astro.

## Get started

For a new documentation site, use the project creator:

```bash
# pnpm
pnpm create @heyo-sh/heyo-docs

# npm
npm create @heyo-sh/heyo-docs@latest

# Yarn
yarn dlx @heyo-sh/create-heyo-docs

# Bun
bun create @heyo-sh/heyo-docs
```

To add the runtime to an existing supported application:

```bash
# pnpm
pnpm add @heyo-sh/heyo-docs

# npm
npm install @heyo-sh/heyo-docs

# Yarn
yarn add @heyo-sh/heyo-docs

# Bun
bun add @heyo-sh/heyo-docs
```

Framework integrations and the configuration reference are available in the [Heyo Docs documentation](https://docs.heyo.sh).

## Import surfaces

The root export is deliberately limited to the `DocsApp` React component. Import
runtime capabilities from their domain entrypoints:

- `@heyo-sh/heyo-docs/config` — configuration validation
- `@heyo-sh/heyo-docs/model` and `/navigation` — documentation model and routes
- `@heyo-sh/heyo-docs/seo` — framework-neutral metadata, JSON-LD, breadcrumbs and sitemaps; `/seo/next` and `/seo/react-router` provide framework adapters
- `@heyo-sh/heyo-docs/openapi` and `/openapi/request` — OpenAPI model and edge-safe request handler
- `@heyo-sh/heyo-docs/next`, `/next/plugins`, `/astro`, `/vite`, `/node` — build and framework adapters
- `@heyo-sh/heyo-docs/theme/provider`, `/theme/script`, `/llm`, `/rss`, `/search`, `/mdx`, `/link`, `/types`
- framework/build adapters: `/vite`, `/astro`, `/next`, `/node`

## Minimum configuration

```ts
import { heyoDocs } from "@heyo-sh/heyo-docs/config";

export default heyoDocs({
  content: "content",
  groups: [
    {
      group: "Documentation",
      sections: [{ pages: ["index"] }],
    },
  ],
});
```

## Contributing

Contributions are welcome. Read the [contribution guide](https://github.com/heyo-sh/heyo-docs/blob/main/CONTRIBUTING.md) before opening a pull request.

## License

[MIT](https://github.com/heyo-sh/heyo-docs/blob/main/LICENSE)
