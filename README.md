# Heyo Docs

Heyo Docs creates a standalone technical documentation project. It is not installed inside an existing product application.

```bash
pnpm create @heyo-sh/heyo-docs
cd my-docs
pnpm dev
pnpm build
pnpm deploy
```

The creator also supports `npm create @heyo-sh/heyo-docs@latest`, `yarn create @heyo-sh/heyo-docs`, and `bun create @heyo-sh/heyo-docs`. The package-manager prompt defaults to the command that launched it.

## Monorepo development

This repository uses Bun workspaces exclusively:

```bash
bun install
bun run dev
bun run build
bun test
bun run typecheck
```

It intentionally has no `pnpm-workspace.yaml` or Turborepo configuration. The generated project can use Bun, pnpm, npm, or Yarn independently.

## Contributing and repository setup

Read [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, pull-request
expectations, and public-API rules. The focused maintainer processes cover
[themes](docs/contributing/add-a-theme.md),
[components](docs/contributing/add-a-component.md), and
[configuration options](docs/contributing/add-a-config-option.md).

The tracked GitHub setup provides CI, CodeQL, Dependabot, issue forms, and
security reporting. Follow [docs/REPOSITORY-SETUP.md](docs/REPOSITORY-SETUP.md)
for the one-time GitHub, npm, licensing, and deployment settings required
before release. The package release process is documented in
[RELEASING.md](RELEASING.md).

## License

[MIT](LICENSE)

## Architecture

```text
@heyo-sh/create-heyo-docs
  → generates a standalone documentation project

@heyo-sh/heyo-docs
  → supplies config validation, content discovery, MDX compilation,
    navigation, SEO, React components and built-in themes

React Router, Next.js and Astro templates
  → thin framework shells that wire routes to DocsApp

examples/react-router, examples/next and examples/astro
  → runnable workspace examples for each supported framework

deployment overlay
  → adds Cloudflare or Vercel files, dependencies and deploy script

heyo-docs.config.ts
  → controls the documentation structure, navigation, theme and metadata
```

The creator composes one framework template with one deployment overlay instead of maintaining templates for each possible combination. Today it implements React Router, Next.js, Astro, and the `grain`, `shade`, and `moss` themes; Dripper and Fixed Gear are displayed as `Soon` in the wizard.

## Built-in themes

Grain, Shade, and Moss are built with shadcn/ui's `base-mira` preset. Grain's CSS variables and Tailwind setup remain exported through `@heyo-sh/heyo-docs/theme.css` for backwards compatibility; each built-in theme is also available at `@heyo-sh/heyo-docs/theme/<name>.css`. Vite-powered templates import `virtual:heyo-docs-theme`, while Next.js imports its selected stylesheet directly. All templates include `components.json` for adding more shadcn components.

The Next.js template uses App Router, generated static MDX registries and route handlers. It imports `@heyo-sh/heyo-docs/theme/{{THEME}}.css` from `app/app.css`, so a newly registered built-in theme uses the same framework shell without route changes. Astro registers the same content pipeline through `@heyo-sh/heyo-docs/astro`; the underlying Vite adapter remains available as `@heyo-sh/heyo-docs/vite` for non-Astro Vite applications. The built-in theme currently uses the preset's `Button` and `Input` components. Add further application-level components with:

```bash
bunx --bun shadcn@latest add <component>
```

Put token overrides after the selected `@heyo-sh/heyo-docs/theme/<name>.css` import in `app/app.css`. The supported built-in themes are `grain`, `shade`, and `moss`. Moss places search and external footer links in the sidebar, centers group tabs in the header, and uses the configured primary color for the active page marker.

## MDX components

The Grain theme registers documentation components for every `.mdx` page. They need no import and are built on local shadcn primitives where appropriate. A generated project includes a `/mdx-components` page with live examples.

| Component        | Child components                       | Useful options                                                                                               |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `Button`         | —                                      | shadcn `variant`, `size`, `href`; `align="left"`, `"center"`, or `"right"`                                   |
| `Tabs`           | `Tab`                                  | `defaultValue`, `variant="default"` or `"line"`                                                              |
| `Accordion`      | `AccordionItem`                        | `title` for a concise one-item form, `multiple`, `defaultOpen`                                               |
| `CodeBlock`      | —                                      | `language`, `title`, `showLineNumbers`                                                                       |
| `CodeSnippet`    | preview content                        | required `code`, plus `language`, `showLineNumbers`, `defaultOpen`, and `previewClassName`                   |
| `CodeBlockGroup` | `CodeBlock`                            | `defaultValue`, `variant`                                                                                    |
| `Tree`           | `Folder`, `File`                       | `Folder` accepts `name` and `defaultOpen`; `File` accepts `name`                                             |
| `Image`          | —                                      | `src`, `alt`, optional `caption`; local relative images are bundled                                          |
| `Video`          | —                                      | `src`, optional `caption` and native video props; controls are enabled by default and local media is bundled |
| `File`           | —                                      | Inside `Tree`, accepts `name`; otherwise `src`/`href`, `name`, optional `description` create a download card |
| `GitHub`         | —                                      | GitHub URL in `href`; `variant="simple"` (default) or `"inset"`; fetches description, stars, and forks       |
| `Steps`          | `Step`                                 | `Step` accepts `title`; step numbers are automatic                                                           |
| `Callout`        | —                                      | `title`, `type` or `variant`; types: `note`, `warning`, `info`, `tip`, `check`, and `danger`                 |
| `Columns`        | `Column`                               | `columns={2}` or `{3}`, `variant="card"` or `"plain"`; `Column` accepts `title` and `href`                   |
| `RelatedTopics`  | `RelatedTopic`                         | `RelatedTopic` accepts `icon`, `name`, and `src`                                                             |
| `HoverCard`      | `HoverCardTrigger`, `HoverCardContent` | Use `HoverCardTrigger` inline in ordinary prose; accepts shadcn/Base UI positioning props                    |
| `Mermaid`        | —                                      | diagram text as children or `chart`, and `variant="svg"` (default) or `"ascii"`                              |

For example:

```mdx
<Tabs variant="line">
  <Tab title="npm">npm install @heyo-sh/heyo-docs</Tab>
  <Tab title="Bun">bun add @heyo-sh/heyo-docs</Tab>
</Tabs>

<CodeBlock language="ts" showLineNumbers title="config.ts">
  {
    "export default heyoDocs({ content: './content', branding: { name: 'My docs' } });"
  }
</CodeBlock>

<CodeSnippet code={`<Callout type="tip" description="Preview first." />`}>
  <Callout type="tip" description="Preview first." />
</CodeSnippet>

<Callout title="No imports needed">
  Write the component directly in any MDX page.
</Callout>

<RelatedTopics>
  <RelatedTopic icon="book" name="Getting started" src="/getting-started" />
</RelatedTopics>
```

`Mermaid` is rendered in the browser after hydration, while its diagram source remains visible during SSR. SVG output follows the active shadcn color tokens; set `variant="ascii"` for Unicode terminal-style output. The bundled code is loaded only when that component is used.

## Images, videos, and local files

Images, videos, and files can be referenced with public URLs, absolute paths from `public`, or relative paths beside an MDX file. Relative assets are imported by Vite, so they are copied with the production build and keep working at nested documentation routes. A relative path can also point at an asset in the application's `src` directory.

```mdx
![Architecture](./assets/architecture.svg)

<Image
  src="../src/assets/product-shot.png"
  alt="Product dashboard"
  caption="The dashboard shown after sign-in."
/>

<Video
  src="./assets/product-tour.mp4"
  poster="./assets/product-tour-poster.png"
  caption="A short tour of the dashboard."
/>

<File
  src="./downloads/quick-reference.pdf"
  name="Quick reference"
  description="Printable PDF · 2 MB"
/>
```

`Image` and `Video` give standalone media the same framed treatment as other MDX blocks; both accept an optional caption. `Video` accepts native video attributes, enables controls by default, and uses `preload="metadata"` unless overridden. Regular Markdown images receive the `Image` treatment too. `File` renders a download card when it receives `src` or `href`, and remains the compact tree item when used without a URL inside `Tree`. Standard Markdown links to local files, such as `[Download the PDF](./downloads/quick-reference.pdf)`, are bundled as well. Authored MDX imports such as `import screenshot from "../src/assets/screenshot.png"` work too. Root-relative paths such as `/images/product-shot.png` continue to refer to `public` unchanged.

## Configuration

```ts
import { heyoDocs } from "@heyo-sh/heyo-docs";
import { headerNavigation } from "./app/header-navigation";

export default heyoDocs({
  title: "My Documentation",
  description: "Developer documentation",
  content: "./content",
  theme: "grain",
  colors: { primary: "#5b21b6", secondary: "#f3e8ff" },
  navigation: headerNavigation,
  groups: [
    {
      group: "Documentation",
      icon: "globe",
      sections: [
        {
          section: "Getting started",
          pages: [
            "index",
            {
              section: "Guides",
              pages: ["docs/quickstart"],
            },
          ],
        },
      ],
    },
  ],
  footer: { github: "https://github.com/acme", website: "https://acme.com" },
  mode: "system",
  branding: { name: "My API", logo: "/logo.svg" },
  siteUrl: "https://docs.example.com",
});
```

`content` is required and identifies the directory containing every MDX page and local OpenAPI document. It is resolved from the application root, so `"./content"` and `"content"` are equivalent; this keeps each app self-contained when it lives inside a monorepo. `title` defaults to `"Heyo Documentation"`; `description` defaults to `"Clear, focused documentation for your project."`; `theme` is `"grain"`; and `mode` is `"system"`. Fonts and the built-in icon pack are selected statically by the application template: React Router imports Figtree in `app/app.css` and maps Remix Icons in `app/heyo-docs-icons.tsx`; Next.js uses the same files below `app/`; Astro uses the corresponding files under `src/`. This keeps unused font files and icon packs out of the production bundle. `colors.primary` and `colors.secondary`, `navigation`, footer links, icons, and `expanded` are all optional. `navigation` accepts an application-owned JSX element; Grain renders it at the right side of the header. Footer URLs must be absolute URLs.

Groups render in the exact order from the configuration. A group defaults to `type: "documentation"` and uses `sections`: each section is either `{ section, pages }` for MDX navigation, `{ pages }` for an unsectioned MDX page list, or `{ schema }` to generate OpenAPI endpoint sections in that exact position. MDX sections default to expanded and may omit `pages`. An unsectioned page list has no section heading, icon, or collapsible control in Grain, and does not appear in breadcrumbs. Each item in `sections[].pages` can name an MDX page without its extension (`"guides/install"`) or a directory (`"guides"`) relative to `content`, an icon-bearing MDX reference (`{ page: "guides/install", icon: "book" }`), a custom link (`{ title: "Admin panel", src: "https://app.example.com" }`), or another `{ section, pages }` object. The `page` and `icon` fields are both required in the icon-bearing form. Heyo Docs first resolves an exact MDX file, then falls back to a directory; use a trailing slash (`"guides/"`) to explicitly select the directory if both exist. An icon on a directory reference is shown for each resolved page, and the first configured occurrence wins when a page is listed more than once. Existing `.md` and `.mdx` references remain supported. Nested sections can be repeated to any depth; Grain renders them as indented expandable sidebar groups, and their pages keep that tree order for breadcrumbs and previous/next navigation. Custom links appear in the sidebar and navigate directly to `src`; they do not need an MDX file and are excluded from previous/next page navigation. Heyo Docs stops the Vite build with a clear error if any configured page or directory does not exist.

The left sidebar's group switcher changes group views. The sidebar only renders the active route's group: documentation groups show their configured sections, while a changelog group replaces those sections with its update dates.

`{ schema }` sections load a JSON or YAML OpenAPI document; `changelog` groups require a non-empty `updates` array. A local schema is resolved relative to `content` (for example `"openapi.yaml"`); a file in `public` can be addressed as `/openapi.json`; HTTP(S) URLs also work. Local schemas are watched in development. Generated applications are static-first: each MDX and generated endpoint route is prerendered during the build. The browser receives a compact endpoint index, then loads a static JSON shard for the endpoint it opens from `/_heyo-docs/openapi/<group>/<tag>/<operation>.json`. Each shard contains the endpoint data and only its reachable component schemas, so the full specification is neither included in the shared browser bundle nor copied into every endpoint asset. The generated endpoint URL is `/<group>/<tag>/<operationId>` with values normalized to kebab case. Object references are explored in nested popovers directly on the endpoint page.

```ts
{
  group: "API Reference",
  sections: [
    {
      section: "Get started",
      pages: ["api-overview"],
    },
    { schema: "./openapi.json" },
  ],
}
```

An OpenAPI section renders generated tag sections where it appears, so it can sit before, after, or between MDX sections. This is the right place for authentication, migration, or conceptual API pages. MDX routes reserve their URL, so a custom page wins if it collides with a generated endpoint route. Generated endpoint entries use a colored HTTP-method badge instead of the normal file icon. Each endpoint page renders path/query/header inputs, request body editing, server selection, documented responses, a live request action, and cURL/JavaScript examples. A referenced HTTP Bearer scheme shows a token input; its value is persisted in browser storage for that security scheme and API group while visitors navigate between endpoints.

A changelog group can also set its page `description`; otherwise the theme uses “Stay up to date with the latest changes and improvements.” Changelog update references follow the same file-or-directory resolution as `pages`, so extensions are optional. Heyo Docs warns about a missing reference during development and fails the production build with an explanation. Each selected MDX page renders as a changelog and can contain date-based `<Update>` components:

```mdx
<Update label="March 2026" tags={["New releases", "Bug fixes"]}>
  ## Highlights

Describe the release here.

</Update>
```

`label` creates the update anchor. Tags are displayed below the date and are also available as multi-select filters: all selected tags must be present on an update, and the selection is preserved in the `?tags=` URL query parameter.

`siteUrl` enables canonical tags and must be an HTTP(S) base URL without a query string or fragment. Every template always serves `robots.txt`, `sitemap.xml`, `rss.xml`, `llms.txt`, `llms-full.txt`, Markdown mirrors for every page, the server-side OpenAPI request proxy, and a 404 page. `rss.xml` contains every `<Update>` in configured changelog groups and is advertised automatically in the document head. Add an optional ISO 8601 `date` to publish an RSS `pubDate`:

```mdx
<Update label="March 2026" date="2026-03-01" tags={["New releases"]}>
  ## Highlights

Describe the release here.

</Update>
```

### ZBSearch

The Grain theme includes local `Cmd/Ctrl + K` search powered by [ZBSearch](https://www.zbsearch.dev/). It indexes every page title, description, heading, and MDX body during the documentation build, then searches that data directly in the browser. No API key, search server, crawler, or extra configuration is required.

The index is shipped with the site, so its size grows with the documentation. It is a good fit for small and medium documentation sites; use a hosted search provider if the index becomes too large for visitors to download.

## Deployment choices

- **Cloudflare** adds the platform adapter, `wrangler.jsonc`, and `wrangler deploy`.
- **Vercel** adds the appropriate framework adapter and `vercel --prod`.
- **Configure later** contains no host-specific dependencies or deploy script.

The React Router overlays keep their platform-specific framework configuration. Next.js uses Vercel's native deployment flow or OpenNext for Cloudflare Workers. Astro uses its Node adapter when deployment is configured later and replaces that adapter with the Cloudflare or Vercel adapter when selected. Across all three templates, documentation pages and OpenAPI JSON are static; the interactive OpenAPI proxy remains server-side for the optional request action. See [Astro deployment](astro-readme.md), [React Router deployment](react-router-readme.md), and [Next.js deployment](nextjs-readme.md) for the framework-specific rendering strategy.

## Publishing checks

Build packages before publishing and inspect the tarballs with Bun:

```bash
cd packages/heyo-docs && bun pm pack --dry-run
cd ../create-heyo-docs && bun pm pack --dry-run
```

`@heyo-sh/create-heyo-docs` declares `templates` and `deployments` in its published files, so generated applications remain available from the npm tarball.
