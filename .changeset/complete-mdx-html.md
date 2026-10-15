---
"@heyo-sh/heyo-docs": minor
"@heyo-sh/create-heyo-docs": minor
---

Serve finished documentation HTML. A document body is no longer wrapped in a Suspense boundary: server rendering imports MDX directly for React Router, Next.js, and Astro, so the page is complete before it is sent, and a streaming renderer can no longer flush `Loading documentation…` for the browser to replace. In the browser the React Router route fetches the destination page's MDX chunk in a `clientLoader` before the new page is displayed, which keeps a chunk per page.

A project that renders `DocsApp` with pages whose `content` suspends must now load that module before it renders the route. The generated React Router project does this for you, and the Vite adapter exposes `page.preload()` for projects that mount the route themselves. Generated projects keep the streaming server entry, because React Router carries its hydration data inside a Suspense boundary that `renderToString` cannot complete.
