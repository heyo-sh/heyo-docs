import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";
import { documentationPaths } from "@heyo-sh/heyo-docs/node";

import config from "./heyo-docs.config";

/** Vercel serves prebuilt docs; Functions are reserved for request actions. */
export default {
  ssr: true,
  presets: [vercelPreset()],
  async prerender() {
    const docs = await documentationPaths(process.cwd(), config);
    return [
      ...docs,
      "/robots.txt",
      "/sitemap.xml",
      "/rss.xml",
      "/llms.txt",
      "/llms-full.txt",
    ];
  },
} satisfies Config;
