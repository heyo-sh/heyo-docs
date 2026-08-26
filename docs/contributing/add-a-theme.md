# Adding a built-in theme

This guide is for a bundled Heyo Docs theme. The `theme` configuration accepts
only names in `builtInThemeNames`, so adding a folder alone does not expose a
new theme to users.

## 1. Decide what belongs in the theme

Put reusable documentation behaviour in `src/theme/components` first. A theme
owns its chrome and composition: layout, header, sidebar, brand treatment, and
placement or omission of optional slots. It must not fork page rendering,
OpenAPI behaviour, or MDX component behaviour merely to change appearance.

Read [`src/theme/README.md`](../../packages/heyo-docs/src/theme/README.md)
before starting.

## 2. Add the theme implementation

Create `packages/heyo-docs/src/theme/<name>/` with at least:

- `index.tsx`, exporting a `HeyoDocsTheme` whose `name` is `<name>`;
- `global.css`, using the shared semantic CSS tokens; and
- only the layout or chrome components that differ from the shared components.

Compose `Layout`, `DocsPage`, `ChangelogPage`, and `OpenApiPage` from the
documented `HeyoDocsThemeComponents` contract in `src/types.ts`. Optional
components such as `Search`, `Tabs`, and `TableOfContents` may be omitted only
when their absence is an intentional product decision.

Keep `@source "./"` and `@source "../components"` in the source stylesheet.
The build script rewrites them when publishing `dist/theme/<name>.css`.

## 3. Register it in both registries

Update both files in the same pull request:

1. Add the name to `src/theme/names.ts`. This is the dependency-free source of
   truth used by config validation.
2. Import the implementation and add it to `src/theme/registry.ts`.

`satisfies Record<BuiltInThemeName, HeyoDocsTheme>` ensures the registry stays
complete. Do not add a name to only one of these files.

## 4. Make it usable in generated projects

The package build copies a stylesheet for every registered name. Verify that
`@heyo-sh/heyo-docs/theme/<name>.css` exists after `bun run build`. Then update the
generator's theme choices, relevant templates, and any theme documentation so
users can select and import the new theme.

## 5. Prove the contract

- Extend `test/theme.test.ts` so `resolveTheme("<name>")` verifies the exact
  component contract.
- Add rendering coverage in `test/components.test.ts` for distinctive layout
  behaviour and optional slots.
- Test light and dark mode, a normal MDX page, a changelog page, an OpenAPI
  page, long navigation, mobile navigation, and a 404 page in an example.
- Run `bun run lint`, `bun run typecheck`, `bun test`, and `bun run build`.

Include before/after screenshots in the pull request. A new theme is a public
API addition, so its name, stylesheet entry point, screenshots, and documented
limitations must ship together.
