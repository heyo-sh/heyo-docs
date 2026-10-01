# @heyo-sh/heyo-docs

## 3.4.1

### Patch Changes

- a208912: Declare the JSX runtime the compiled pages import, and invert a configured logo
  in the Heyo theme's dark mode.

  Vite's dependency scanner only crawls real files, and every page this adapter
  emits lives behind a virtual module, so `react/jsx-runtime` stayed invisible
  until a page was rendered. In an environment that bundles its server
  dependencies — a Cloudflare Worker, say — discovering it mid-request made Vite
  re-optimise and reload while a render was in flight, which left two copies of
  React in one tree and failed the first request after a cold cache with
  `Cannot read properties of null (reading 'useContext')`. The adapter now
  declares the runtime for every environment, so the optimiser is complete before
  the first request and no application needs an `optimizeDeps` entry of its own.

  The Heyo theme also rendered `branding.logo` without `dark:invert`, so a
  monochrome mark drawn for the light surface disappeared on the dark one.

  And the Heyo and Moss themes left the `<pre>` honouring the newline Shiki
  writes between its line spans. Because those spans are already blocks, every
  line break in a highlighted block was rendered twice — only after hydration,
  since the server renders unhighlighted markup that has no such newline.

## 3.4.0

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

## 3.3.0

### Minor Changes

- f58d6a3: Add the Databuddy analytics integration. `integrations.analytics.databuddy`
  renders Databuddy's asynchronous CDN tracker with only public configuration:
  `clientId`, an optional self-hosted `scriptUrl` and `apiUrl`, the documented
  `track*` options, batching, sampling, and `skipPatterns`/`maskPatterns` path
  controls. The tracker follows client-side navigation on its own, so no
  framework-specific route callback is required.

## 3.2.0

### Minor Changes

- 1dc0e7b: Add configurable Copy for LLM and Open page actions, resolve their Markdown URLs from the public browser path, and preserve path-prefixed `siteUrl` values in generated AI and SEO URLs.

## 3.1.0

### Minor Changes

- 576af21: Replace the documentation footer credit with a link to Heyo.

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

## 1.0.2

### Patch Changes

- eb58b25: Fix Grain theme branding logos so they match the shared logo size and remain visible in dark mode.

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

## 0.3.1

### Patch Changes

- c202dd5: Fix scroll tracking

## 0.3.0

### Minor Changes

- a86cebb: Add AI chat support

## 0.2.0

### Minor Changes

- a86cebb: Add integrations

## 0.1.3

### Patch Changes

- f3d1f73: Update Example templates

## 0.1.2

### Patch Changes

- 9a0ab87: Fix npm packaging by building distribution files before publishing.
- f12641d: Update Creator command

## 0.1.1

### Patch Changes

- e882fce: Correct GitHub repository metadata for trusted publishing.
