import type { Config } from "@react-router/dev/config";
import { documentationPaths } from "@heyo-sh/heyo-docs/node";

import config from "./heyo-docs.config";

/** Static docs use CDN files; only the interactive request proxy needs runtime SSR. */
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
