# Heyo Docs

The themeable documentation runtime behind Heyo Docs sites. It provides MDX content, navigation, search, OpenAPI reference pages, and SEO utilities for React Router, Next.js, and Astro.

## Get started

For a new documentation site, use the project creator:

```bash
pnpm create @heyo-sh/heyo-docs my-docs
```

To add the runtime to an existing supported application:

```bash
pnpm add @heyo-sh/heyo-docs
```

Framework integrations and the configuration reference are available in the [Heyo Docs documentation](https://docs.heyo.sh).

## Minimum configuration

```ts
import { heyoDocs } from "@heyo-sh/heyo-docs";

export default heyoDocs({
  content: "content",
  groups: [
    {
      group: "Documentation",
      sections: [{ pages: ["index"] }],
    },
  ],
});
```

## Contributing

Contributions are welcome. Read the [contribution guide](https://github.com/heyo-sh/heyo-docs/blob/main/CONTRIBUTING.md) before opening a pull request.

## License

[MIT](https://github.com/heyo-sh/heyo-docs/blob/main/LICENSE)
