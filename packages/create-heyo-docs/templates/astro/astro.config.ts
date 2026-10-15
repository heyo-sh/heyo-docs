import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { heyoDocsAstro } from "@heyo-sh/heyo-docs/astro";

import config from "./heyo-docs.config";
import { platformAdapter } from "./platform.astro";

export default defineConfig({
  adapter: platformAdapter,
  // MDX is imported eagerly on the server. Static rendering prevents Astro's
  // React renderer from serialising an intermediate Suspense fallback into HTML.
  integrations: [
    react({ experimentalDisableStreaming: true }),
    heyoDocsAstro({ config }),
  ],
  output: "static",
  site: config.siteUrl,
  vite: { plugins: [tailwindcss()] },
});
