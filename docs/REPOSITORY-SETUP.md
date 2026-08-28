# Public repository and release setup

The tracked files provide CI, CodeQL, Dependabot, issue forms, pull-request
guidance, contribution processes, security reporting, and support routing.
Complete the following GitHub and registry settings before the first release.

## GitHub settings

1. Create the `heyo-sh/heyo-docs` repository, set `main` as its default branch,
   and enable GitHub Discussions plus private vulnerability reporting.
2. Add a branch ruleset for `main`: require a pull request, at least one
   approval, resolved conversations, and the `Quality` status check from CI;
   block force pushes and direct deletion.
3. Enable Dependabot alerts, Dependabot security updates, secret scanning, and
   push protection. Enable the CodeQL workflow under **Security → Code
   scanning** if GitHub asks for confirmation.
4. Create these labels: `bug`, `enhancement`, `documentation`,
   `good first issue`, `help wanted`, `needs-triage`, `breaking change`, and
   `security` (the last one is for internal triage only, never public reports).
5. Replace the GitHub organization URLs in issue, support, and security files
   if the final owner is not `heyo-sh/heyo-docs`.

## Package release flow

Publish `@heyo-sh/heyo-docs` before deploying the separate `heyo-landing` repository:
the landing app depends on the public npm range `^0.1.3` and no longer has a
workspace link to the library.

Changesets and the protected release workflow are already tracked in this
repository. For npm environment setup, the one-time first publish, and the
transition to npm Trusted Publishing (OIDC), follow [RELEASING.md](../RELEASING.md).

## Landing deployment

`heyo-landing` is now a separate React Router application configured for
Cloudflare Workers through Wrangler. Its Worker serves SSR and API actions,
while static build assets are served from `build/client`. After publishing the
first `@heyo-sh/heyo-docs` package, run `bun install` in the landing repository and
commit the generated `bun.lock` before enabling its own CI or deployment
workflow. Keep Cloudflare credentials in the host integration or a GitHub
Environment, never in the repository. A safe production flow is preview
deployments for pull requests and deployment of `main` only after its checks
pass.

## License gate

The repository and both published packages are licensed under MIT. Before the
first release, verify that the copyright holder in the root `LICENSE` file is
the intended legal owner and preserve any notices required by code copied from
third-party projects.
