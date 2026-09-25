---
"@heyo-sh/heyo-docs": minor
---

Add the Databuddy analytics integration. `integrations.analytics.databuddy`
renders Databuddy's asynchronous CDN tracker with only public configuration:
`clientId`, an optional self-hosted `scriptUrl` and `apiUrl`, the documented
`track*` options, batching, sampling, and `skipPatterns`/`maskPatterns` path
controls. The tracker follows client-side navigation on its own, so no
framework-specific route callback is required.
