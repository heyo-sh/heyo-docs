import { cloudflare } from "@cloudflare/vite-plugin";

export const platformPlugins = [
  cloudflare({ viteEnvironment: { name: "ssr" } }),
];
export const platformViteConfig = {};
