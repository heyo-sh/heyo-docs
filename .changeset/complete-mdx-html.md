---
"@heyo-sh/heyo-docs": patch
"@heyo-sh/create-heyo-docs": patch
---

Serve finished documentation HTML instead of a loading placeholder that the browser replaces. Server rendering imports MDX directly for React Router, Next.js, and Astro, `DocsApp` takes a `suspendMdx` prop so a renderer that never suspends can drop the Suspense boundary that made streaming flush a placeholder, and the React Router route fetches a page's MDX chunk in a `clientLoader` before the new page is displayed. Generated projects use the matching renderer settings and keep the streaming server entry, because React Router carries its hydration data inside a Suspense boundary that `renderToString` cannot complete.
