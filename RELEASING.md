# Releasing Heyo Docs

Packages are versioned with [Changesets](https://github.com/changesets/changesets)
and published only by GitHub Actions.

## One-time repository setup

1. In npm, verify that the account creating the token is a member of the
   `@heyo-sh` organization. It must be able to publish organization packages.
   Do not try to create either package in npm's UI: the first approved release
   creates `@heyo-sh/heyo-docs` and `@heyo-sh/create-heyo-docs` automatically.
2. For the first publish only, create an npm automation or granular token with
   publish access to those two packages (or to the `@heyo-sh` scope).
3. In GitHub, create an environment named `npm`, restrict it to `main`, and add
   the required reviewers you want for a production release.
4. Add the token as the `NPM_TOKEN` secret in that `npm` environment. Do not add
   it as a repository-wide secret.
5. In npm, enable 2FA for the owning account or organization and grant only the
   required maintainers publish access.
6. In GitHub Actions settings, allow the workflow `GITHUB_TOKEN` to create pull
   requests and write repository contents.
7. After the packages exist on npm, configure each package's **Trusted Publisher**
   for the `heyo-sh/heyo-docs` repository, the `release.yml` workflow, and the `npm`
   environment. Then remove `NPM_TOKEN`. The workflow has the required OIDC
   permission and npm will use short-lived credentials automatically.

## Normal release flow

1. For every user-facing package change, run `bun run changeset`, choose the
   smallest correct semver bump, and commit the generated file.
2. Merge the pull request into `main`.
3. The **Release** workflow opens or updates a version pull request.
4. Review and merge that pull request. The workflow then asks for approval of
   the `npm` environment and publishes the versioned packages.

The first run on `main` can publish the existing package versions directly when
the npm packages do not yet exist. Inspect package contents with
`bun pm pack --dry-run` and approve the protected `npm` environment only after
that review.

Never publish from a local machine. Use `bun pm pack --dry-run` locally to
inspect the files that a future release would contain.
