# Changesets

Run `bun run changeset` for every user-facing package change. Choose the smallest
appropriate semver bump and describe the change in plain language. Do not add a
changeset for documentation-only, CI-only, or internal test-only changes.

When a changeset is merged into `main`, the release workflow opens or updates a
release pull request. Merging that pull request publishes the resulting package
versions to npm.
