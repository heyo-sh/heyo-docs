# @heyo-sh/heyo-docs

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
