import type { Config } from "@react-router/dev/config";
import { documentationPaths } from "@heyo-sh/heyo-docs/node";

import config from "./heyo-docs.config";

/** Cloudflare serves prebuilt docs; the Worker is reserved for request actions. */
export default {
  ssr: true,
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
