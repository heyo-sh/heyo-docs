---
"@heyo-sh/heyo-docs": patch
---

Declare the JSX runtime the compiled pages import, and invert a configured logo
in the Heyo theme's dark mode.

Vite's dependency scanner only crawls real files, and every page this adapter
emits lives behind a virtual module, so `react/jsx-runtime` stayed invisible
until a page was rendered. In an environment that bundles its server
dependencies — a Cloudflare Worker, say — discovering it mid-request made Vite
re-optimise and reload while a render was in flight, which left two copies of
React in one tree and failed the first request after a cold cache with
`Cannot read properties of null (reading 'useContext')`. The adapter now
declares the runtime for every environment, so the optimiser is complete before
the first request and no application needs an `optimizeDeps` entry of its own.

The Heyo theme also rendered `branding.logo` without `dark:invert`, so a
monochrome mark drawn for the light surface disappeared on the dark one.

And the Heyo and Moss themes left the `<pre>` honouring the newline Shiki
writes between its line spans. Because those spans are already blocks, every
line break in a highlighted block was rendered twice — only after hydration,
since the server renders unhighlighted markup that has no such newline.
