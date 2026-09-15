---
"@heyo-sh/heyo-docs": patch
"@heyo-sh/create-heyo-docs": patch
---

Allow AI credentials to be supplied directly to `createAiChatResponse` for the
current request, so Cloudflare routes can use native Worker bindings instead of
reading secrets while documentation configuration is built.

Generate Cloudflare templates that read AI credentials from their native Worker
bindings.
