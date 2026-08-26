# Adding a reusable component

First choose the smallest stable extension point. This avoids baking one
theme's visual choices into every project.

## Choose the component kind

| Need                                                                                | Home                                                                                      |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Documentation, changelog, OpenAPI, navigation, or search behaviour shared by themes | `packages/heyo-docs/src/theme/components/<area>`                                          |
| Layout, header, sidebar, or brand treatment unique to one built-in theme            | `packages/heyo-docs/src/theme/<name>`                                                     |
| Application-owned MDX component supplied by a consumer                              | Keep it in the consuming app and pass it through `DocsApp`'s `mdxComponents` prop         |
| New built-in MDX tag                                                                | Shared component plus registration in `theme/components/documentation/mdx-components.tsx` |

## Build a shared component

1. Put the implementation in the closest functional directory under
   `src/theme/components`; do not import a named theme from shared code.
2. Use semantic CSS tokens and existing UI primitives. New tokens need a
   cross-theme implementation and documentation.
3. Keep its props explicit and export a type when consumers need to use it.
4. If it is part of the package API, export it from `src/index.tsx`. An internal
   file path is not a public API just because it exists in the repository.
5. Add a focused server-rendering or behaviour test under `test/`.

## Add a built-in MDX tag

1. Implement the component in
   `src/theme/components/documentation/mdx/` when it fits an existing area.
2. Register its exact PascalCase MDX name in
   `mdx-components.tsx`; that registry is the built-in MDX surface.
3. Add compiler/rendering coverage in `test/mdx-components.test.ts` and user
   behaviour coverage when it is interactive.
4. Document the tag, props, accessibility behaviour, and a copyable MDX
   example. Update a generated example when it helps people discover it.

## Compatibility checklist

- Support SSR and hydration; do not access browser globals during render.
- Add keyboard and accessible-name behaviour for interactive controls.
- Keep visual styles usable in every built-in theme and both color modes.
- Avoid adding a dependency when an existing primitive covers the need.
- Include the new component in package exports and release notes only after its
  API is tested and documented.
