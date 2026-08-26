import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { heyoDocs } from "@heyo-sh/heyo-docs/vite";

import config from "./heyo-docs.config.ts";
import { platformPlugins, platformViteConfig } from "./platform.vite.ts";

export default defineConfig({
  ...platformViteConfig,
  plugins: [
    tailwindcss(),
    ...platformPlugins,
    reactRouter(),
    heyoDocs({ config }),
  ],
});
