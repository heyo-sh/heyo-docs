# @heyo-sh/create-heyo-docs

## 3.1.0

### Minor Changes

- 095ede5: Add `heyo`, a console theme built on the heyo-ui design language.

  Select it with `theme: "heyo"`, import `@heyo-sh/heyo-docs/theme/heyo.css`, and
  render `heyoTheme` — or pick **Heyo** in `create-heyo-docs`.

  What it is:

  - **A monochrome accent.** `--primary` is the inverse of the page, near-black on
    light and near-white on dark, so hue is left to mean one thing: status.
  - **Flat surfaces and translucent edges.** The sidebar shares the page fill and
    a single hairline separates it; nothing floats on its own tint. Edge colours
    are translucent, so one value is correct on every surface.
  - **A dense 12 / 13 / 14 / 16px scale**, with hierarchy from weight and colour
    rather than size, and shadows reduced to a hairline plus a whisper of drop.

  What it composes differently:

  - The group switcher is a `Select`-shaped control at the top of the sidebar
    instead of header tabs, and it disappears when there is only one group. Header
    tabs and segmented tracks both need room proportional to the number of groups,
    which a 15rem rail does not have.
  - Search sits directly under it, with the shortcut spelled out as keycaps.
  - The breadcrumb owns the 48px header; colour mode is toggled there so it stays
    reachable while the sidebar is a closed drawer.
  - Sidebar sections disclose their pages, count them, and hang them off a guide
    rail at every depth. Changelog entries use the same rail with a marker for the
    entry under the reading line.
  - External links pin to the sidebar footer, which renders nothing when no
    website or repository is configured.
  - The 404 body is styled rather than inheriting browser defaults.

  The shared search component now accepts `triggerClassName` and `triggerContent`
  for its button trigger, and labels it `Search documentation`. Themes that want a
  search affordance of their own no longer have to reach for the read-only input:
  browsers always treat a focused text field as keyboard-focused, so restoring
  focus to one after the dialog closes parks a focus ring on it.

## 3.0.0

### Major Changes

- 0765bc0: Render declarative header navigation as `Button` links with a `variant` that defaults to `link`, and rename the primary button variant from `default` to `primary`.

  Remove legacy CSS, Vite 5, Swagger 2, and Cloudflare `OPENAI_API_KEY` compatibility paths.

## 2.0.0

### Major Changes

- 014e2bd: Split utility APIs into domain entrypoints. The root package now exports only
  `DocsApp`; import configuration, model, navigation, SEO, OpenAPI, LLM, RSS,
  search, MDX, and types from their dedicated subpaths. SEO now provides
  framework-neutral metadata, automatic JSON-LD/breadcrumbs, React Router meta
  descriptors, and safe JSON-LD serialization. `/seo/next` exposes `nextDocsSeo()` and
  `nextSiteSeo()`.

  Framework-specific APIs now live under their domain: React Router metadata is
  `/seo/react-router`, Next's MDX plugin is `/next/plugins`, the edge-safe OpenAPI
  handler is `/openapi/request`, and theme runtime utilities are `/theme/provider`
  and `/theme/script`.

  `@heyo-sh/create-heyo-docs` is released as 2.0.0 alongside the runtime. Its
  templates use the new entrypoints, so `npm create @heyo-sh/heyo-docs@2.0.0`
  resolves a matching creator package.

## 1.0.1

### Patch Changes

- 1e5477b: Allow AI credentials to be supplied directly to `createAiChatResponse` for the
  current request, so Cloudflare routes can use native Worker bindings instead of
  reading secrets while documentation configuration is built.

  Generate Cloudflare templates that read AI credentials from their native Worker
  bindings.

## 1.0.0

### Major Changes

- cf9811a: Replace the AI SDK chat adapters with Pi. AI chat authentication is now an
  explicit `auth` object: API key, refreshable OAuth, AWS credential-chain, and
  Bedrock bearer-token modes are supported.

## 0.4.0

### Minor Changes

- a86cebb: Add AI chat support

## 0.3.0

### Minor Changes

- a86cebb: Add integrations

## 0.2.3

### Patch Changes

- 96c9836: Fix generated Next.js projects and block the unsupported React Router 8 + Vercel combination.

## 0.2.2

### Patch Changes

- e2af9e1: Update Templates Version

## 0.2.1

### Patch Changes

- f3d1f73: Update Example templates

## 0.2.0

### Minor Changes

- f12641d: Update Creator command

## 0.1.1

### Patch Changes

- e882fce: Correct GitHub repository metadata for trusted publishing.
