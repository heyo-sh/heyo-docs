---
"@heyo-sh/heyo-docs": major
"@heyo-sh/create-heyo-docs": major
---

Split utility APIs into domain entrypoints. The root package now exports only
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
