# Create Heyo Docs

Create a standalone, production-ready documentation site with Heyo Docs. Choose React Router, Next.js, or Astro, plus a built-in theme and deployment target.

## Create a project

Run the creator without arguments to choose the project directory, framework,
deployment target, theme, and package manager interactively. It prints the
appropriate `cd` and development-server commands when it finishes.

```bash
# pnpm
pnpm create @heyo-sh/heyo-docs

# npm
npm create @heyo-sh/heyo-docs@latest

# Yarn
yarn dlx @heyo-sh/create-heyo-docs

# Bun
bun create @heyo-sh/heyo-docs
```

The creator works with pnpm, npm, Yarn, and Bun.

## Options

Passing options makes the creator non-interactive; include a project-directory
argument when using them in automation.

| Option              | Values                          |
| ------------------- | ------------------------------- |
| `--template`        | `react-router`, `next`, `astro` |
| `--theme`           | `grain`, `shade`, `moss`        |
| `--deployment`      | `cloudflare`, `vercel`, `later` |
| `--package-manager` | `bun`, `pnpm`, `npm`, `yarn`    |
| `--no-install`      | Skip dependency installation    |

Read the [full documentation](https://docs.heyo.sh) for configuration, content, components, framework integrations, and deployment.

## License

[MIT](https://github.com/heyo-sh/heyo-docs/blob/main/LICENSE)
