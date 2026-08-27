# Create Heyo Docs

Create a standalone, production-ready documentation site with Heyo Docs. Choose React Router, Next.js, or Astro, plus a built-in theme and deployment target.

## Create a project

```bash
# pnpm
pnpm create @heyo-sh/heyo-docs my-docs
cd my-docs
pnpm dev

# npm
npm create @heyo-sh/heyo-docs@latest my-docs
cd my-docs
npm run dev

# Yarn
yarn dlx @heyo-sh/create-heyo-docs my-docs
cd my-docs
yarn dev

# Bun
bun create @heyo-sh/heyo-docs my-docs
cd my-docs
bun run dev
```

The creator works with pnpm, npm, Yarn, and Bun.

## Options

```bash
pnpm create @heyo-sh/heyo-docs my-docs \
  --template astro \
  --theme moss \
  --deployment cloudflare
```

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
