# Theme architecture

`theme/components` contains the reusable documentation experience: MDX
components, OpenAPI views, changelog views, navigation controls, page actions,
search UI, and breadcrumbs. These components use semantic CSS tokens and must
not import a concrete theme.

`theme/<name>` contains only the theme chrome: page layout, header, sidebar,
brand treatment, and the composition of slots. A theme may place the shared
search component in its header, sidebar, or omit it; the same applies to
breadcrumbs, tabs, the table of contents, and sidebar footer.

`names.ts` is the dependency-free list of bundled themes. Add a name there and
its implementation to `registry.ts` together. Keeping the list free of React
imports means config validation never has to load a theme implementation.

When adding a reusable component:

1. Put it in the closest `theme/components/<area>` directory.
2. Keep product behavior and visual details inside the component; do not make
   it depend on Grain's layout.
3. Register MDX components in `components/documentation/mdx-components.tsx`.
4. Add focused rendering or behavior coverage in `test/`.

When adding a theme, compose the existing `theme/components` in its `index.tsx`
and only create new components for a genuine visual or layout difference.
