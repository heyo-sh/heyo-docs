<div align="center">
  <img src="./public/heyo-docs-hero.webp" alt="Heyo Docs Logo"/>

  <p>
    <a href="https://npmjs.com/package/@heyo-sh/heyo-docs"><img src="https://img.shields.io/npm/dm/%40heyo-sh%2Fheyo-docs?style=flat&amp;colorA=000000&amp;colorB=000000" alt="npm downloads"/></a>
    <a href="https://www.npmjs.com/package/@heyo-sh/heyo-docs"><img src="https://img.shields.io/npm/v/%40heyo-sh%2Fheyo-docs.svg?style=flat&amp;colorA=000000&amp;colorB=000000" alt="npm version"/></a>
    <a href="https://github.com/heyo-sh/heyo-docs/stargazers"><img src="https://img.shields.io/github/stars/heyo-sh/heyo-docs?style=flat&amp;colorA=000000&amp;colorB=000000" alt="GitHub stars"/></a>
    <img src="https://img.shields.io/badge/28%2B%20integrations-000000?style=flat&amp;colorA=000000&amp;colorB=000000" alt="28+ integrations"/>
    <img src="https://img.shields.io/badge/AI--First-000000?style=flat&amp;colorA=000000&amp;colorB=000000" alt="AI-First"/>
  </p>

  <p style="margin-top: 0.375rem;">
    <a href="https://heyo.sh/introduction/">Documentation</a>
    ·
    <a href="https://heyo.sh/changelog">Changelog (Demo)</a>
    ·
    <a href="https://heyo.sh/api-demo/overview">OpenAPI (Demo)</a>
  </p>
</div>

## Heyo Docs

A themeable documentation toolkit for React Router, Next.js, and Astro.
Create a standalone documentation site with MDX content, navigation, search,
OpenAPI reference pages, and built-in SEO.

## Get started

Start the creator and answer its questions about the project directory,
framework, deployment target, theme, and package manager. When it finishes, it
prints the exact commands for starting the development server.

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

The creator works with pnpm, npm, Yarn, and Bun. It lets you choose React
Router, Next.js, or Astro, plus a theme and deployment target.

For an existing application, follow the framework-specific guides for [React Router](https://heyo.sh/framework/react-router), [Next.js](https://heyo.sh/framework/nextjs), or [Astro](https://heyo.sh/framework/astro).

## Minimum Configuration

`heyo-docs.config.ts` is the single source of truth for your site's content, navigation, appearance, and metadata. Only `content` is required:

```ts
import { heyoDocs } from "@heyo-sh/heyo-docs/config";

export default heyoDocs({
  title: "Acme Docs",
  description: "Guides and API reference for Acme.",
  content: "content",
  theme: "grain",
  siteUrl: "https://docs.acme.com/handbook",
  branding: { name: "Acme", logo: "/logo.svg" },
  navigation: [
    { label: "Status", href: "https://status.acme.com" },
    { label: "Sign in", href: "https://app.acme.com", variant: "primary" },
  ],
  groups: [
    {
      group: "Documentation",
      sections: [
        {
          section: "Get started",
          pages: ["index", "quickstart"],
        },
      ],
    },
  ],
});
```

Header navigation renders each item as a `Button`. Its `variant` uses the same values as `Button` and defaults to `link`; use `primary` for prominent actions. `siteUrl` is the canonical public documentation root and may include a mount path such as `/handbook`.

## Markdown and AI actions

Every documentation, changelog, and OpenAPI page shows **Copy for LLM** and
**Open** by default. They use the stable public `.md` representation of the
current page; mounted docs paths are derived from the browser URL, without a
framework-specific adapter. They do not require AI Chat credentials.

Configure either action independently only when needed:

```ts
ai: {
  copyForLLM: "disabled", // default: "enabled"
  openIn: "enabled", // default: "enabled"
}
```

The selected framework must serve public `*.md` endpoints. All generated
projects already do; see the [Markdown endpoint guide](https://heyo.sh/tutorials/markdown-endpoints).

Read the [configuration guide](https://heyo.sh/manage-website/configuration) for the complete reference, then add pages under `content/`. Built-in MDX components, OpenAPI, deployment, and styling guides live in the [documentation](https://heyo.sh).

The root package exports only `DocsApp`; import capabilities from domain entrypoints such as `/config`, `/model`, `/navigation`, `/seo`, `/openapi`, `/llm`, `/rss`, `/search`, `/mdx`, `/link`, and `/types`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development and contribution guidelines.

## License

[MIT](LICENSE)
