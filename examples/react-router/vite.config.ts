import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { heyoDocs } from "@heyo-sh/heyo-docs/vite";

import config from "./heyo-docs.config.ts";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), heyoDocs({ config })],
});
