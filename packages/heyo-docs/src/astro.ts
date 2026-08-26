import { heyoDocs, type HeyoDocsViteOptions } from "./vite";

/**
 * The small structural subset of Astro's integration API that this adapter
 * needs. Keeping it local means `@heyo-sh/heyo-docs/astro` does not make Astro a runtime
 * dependency of the framework-neutral package.
 */
export interface HeyoDocsAstroIntegration {
  name: string;
  hooks: {
    "astro:config:setup": (context: {
      updateConfig(config: {
        vite?: { plugins?: ReturnType<typeof heyoDocs>[] };
      }): void;
    }) => void;
  };
}

/**
 * Adds Heyo Docs' content and MDX virtual modules to an Astro project.
 *
 * Astro uses Vite internally, but exposing that implementation only through
 * this entrypoint keeps an Astro application's framework glue separate from
 * direct Vite and Next.js integrations.
 */
export function heyoDocsAstro(
  options: HeyoDocsViteOptions,
): HeyoDocsAstroIntegration {
  return {
    name: "heyo-docs:astro",
    hooks: {
      "astro:config:setup"({ updateConfig }) {
        updateConfig({ vite: { plugins: [heyoDocs(options)] } });
      },
    },
  };
}
