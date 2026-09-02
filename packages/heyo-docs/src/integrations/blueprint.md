# Integration blueprint

Integrations are global, browser-facing configuration. They are grouped by
purpose so a documentation site can make consent decisions before analytics and
support tooling is loaded:

```ts
integrations: {
  analytics: {
    adobe: { launchUrl: "https://assets.adobedtm.com/..." },
  },
  support: {
    intercom: { appId: "abc123" },
  },
  consent: {
    osano: { scriptUrl: "https://cmp.osano.com/.../osano.js" },
  },
}
```

## Adding an integration

1. Create one file at `src/integrations/<category>/<provider>.ts`. The file
   owns that provider's schema, TypeScript type, and browser output.
2. Add the optional provider property to the category in `src/types.ts`.
3. Import the provider's schema directly in `src/config.ts` and add it to the
   matching strict Zod object. The normalized config must always contain the
   `analytics`, `support`, and `consent` objects, even when they are empty.
4. Wire the provider into the document head of all three application shells:
   Next.js, React Router, and Astro. Preserve provider-specific script order
   and loading behaviour; consent integrations run before analytics and support
   integrations.
5. Add tests for config defaults and validation, the provider's emitted script,
   and the three generated templates. Run the complete project checks.

Do not add a provider registry, generic script factory, or a shared integration
component. Provider snippets, ordering constraints, consent requirements,
single-page-app behaviour, and public configuration vary too much to safely
abstract. Small duplication at the framework boundary is intentional.

## Security and lifecycle

Only put public identifiers and public script URLs in `heyo-docs.config.ts`.
Never add private API keys or server credentials: the configuration is bundled
into client-facing output. Validate every URL and escape any value embedded in
an inline script. A consent provider may need to load synchronously and before
all other third-party providers. Confirm the provider's current policy before
changing that order.

Templates are the supported integration boundary for each framework. Existing
projects should copy the small provider-specific imports and head markup from
the corresponding current template when adopting a newly released integration.
