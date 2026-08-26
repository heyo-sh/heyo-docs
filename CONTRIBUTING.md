# Contributing to Heyo Docs

Thanks for helping improve Heyo Docs. Contributions can cover the runtime,
framework adapters, starter templates, themes, docs, tests, or examples.

## Before opening an issue

Search existing issues and discussions first. Use an issue for a reproducible
bug or a scoped proposal; use GitHub Discussions for questions and early ideas.
Security vulnerabilities must be reported privately as described in
[SECURITY.md](SECURITY.md).

## Local setup

Heyo Docs is a Bun workspace. Use the version declared in `package.json`.

```bash
bun install --frozen-lockfile
bun run lint
bun run knip
bun run typecheck
bun test
bun run build
```

The workspace contains:

- `packages/heyo-docs` — public runtime, Vite/Next/Astro adapters, themes and tests.
- `packages/create-heyo-docs` — project generator, templates and deployment overlays.
- `examples/*` — runnable integration examples for supported frameworks.

Use the smallest appropriate scope. A runtime change normally needs focused
tests in `packages/heyo-docs/test`, while a generated-project change should
also update the matching template and example.

## Pull requests

1. Start from an up-to-date `main` branch and keep the pull request focused.
2. Explain the user-facing effect, link the related issue, and include a
   reproduction or screenshots when UI behaviour changes.
3. Add a regression test for fixes and tests for new public behaviour.
4. Update the public documentation, templates, and examples when their
   contract changes.
5. Run all local checks above. CI runs the same checks and must pass.

For a user-facing package change, also run `bun run changeset` and commit the
generated file from `.changeset/`. Do not add a changeset for documentation,
CI, or test-only changes.

Avoid committing generated `dist`, `build`, framework output, dependency
directories, secrets, or local environment files. The package build recreates
published assets.

## Contribution license

By submitting a contribution, you confirm that you have the right to submit
it and license your contribution under this repository's
[MIT License](LICENSE).

## Public API and compatibility

`heyo-docs` is a library. Treat exports, configuration, generated project
behaviour, and documented CSS entry points as public contracts. Keep additions
backwards compatible unless the issue and pull request explicitly identify a
breaking change. Do not silently change default visual behaviour across themes.

Read the focused guides before changing an extension point:

- [Adding a built-in theme](docs/contributing/add-a-theme.md)
- [Adding a reusable component](docs/contributing/add-a-component.md)
- [Adding a configuration option](docs/contributing/add-a-config-option.md)
