# @heyo-sh/heyo-docs

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
