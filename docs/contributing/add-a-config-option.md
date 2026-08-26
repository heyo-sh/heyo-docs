# Adding a configuration option

Configuration is a public, validated contract. Every option must have one
source of truth, a stable default, and an observable effect in every supported
framework.

## Design the option first

Open or link an issue that answers:

- What user problem does this solve?
- Is it global configuration, a group/section option, a component prop, or an
  application concern that should stay outside Heyo Docs?
- What is the default, and will changing it alter existing sites?
- Does the value need to be serialised to generated browser data?

Prefer a narrow option with a clear default over a bag of loosely related
settings. Do not introduce a framework-specific option into the core config
without a framework-independent contract.

## Implement the whole data path

1. Add the input shape to the applicable `User*` type in `src/types.ts`.
2. Add the normalised, required-or-optional runtime shape to `HeyoDocsConfig`
   or the relevant normalised type in the same file.
3. Define validation, defaulting, and normalisation in `src/config.ts` with
   Zod. Reject unknown or unsafe values explicitly.
4. Return the normalised value from `validateConfig()` and pass it to every
   consumer that needs it: model creation, `DocsApp`, theme slots, Vite, Next,
   Astro, and generated registries as applicable.
5. Update templates and examples only when users must set the option. Existing
   projects must keep working through the default.

Never use a value from `UserHeyoDocsConfig` directly after validation; runtime
code should consume the normalised object.

## Test and document

- Extend `test/config.test.ts` for defaults, valid input, invalid input, and
  normalisation.
- Add a focused integration or rendering test proving the runtime effect.
- Update the configuration reference, framework guides, and generated example
  when the option is user-facing.
- Call out a changed default or removed option as a breaking change.
- Run `bun run lint`, `bun run typecheck`, `bun test`, and `bun run build`.

The pull request description should include the intended user configuration and
the default behaviour for existing installations.
