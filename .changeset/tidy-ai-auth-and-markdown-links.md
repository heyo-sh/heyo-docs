---
"@heyo-sh/heyo-docs": major
"@heyo-sh/create-heyo-docs": patch
---

Use `ai.chat.auth` as the sole AI Chat credential setting. Remove the separate request-handler `auth` option, and allow API-key tokens to be resolved from server-only platform secrets when a request arrives. Keep the Cloudflare creator's `HEYO_DOCS_AI_API_KEY` binding working by mapping it into `ai.chat.auth` when no explicit auth is configured.

Link `llms.txt` entries to the public `.md` representation of each page, including `/index.md` for the home page.
