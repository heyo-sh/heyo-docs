---
"@heyo-sh/create-heyo-docs": patch
---

Keep the request endpoints below `/heyo-docs-internal/` out of search results in the generated `robots.txt`, and resolve OpenAPI endpoint data in the React Router route's server loader only. The previous browser branch could never run, because React Router strips `loader` from the client bundle.
