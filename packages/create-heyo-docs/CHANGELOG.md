# @heyo-sh/create-heyo-docs

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
