import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { heyoDocsMdxOptions } from "@heyo-sh/heyo-docs/next";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const turbopackRoot = resolve(projectRoot, "../..");

const nextConfig: NextConfig = {
  // Pi resolves provider executors dynamically at runtime. Keep its Node-only
  // packages external so Next does not replace that resolver during bundling.
  serverExternalPackages: [
    "@mariozechner/pi-agent-core",
    "@mariozechner/pi-ai",
  ],
  turbopack: {
    root: turbopackRoot,
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:path*.md",
          destination: "/heyo-docs-internal/markdown/:path*.md",
        },
      ],
    };
  },
};

const withMdx = createMDX({
  options: heyoDocsMdxOptions({ root: process.cwd() }) as never,
});

export default withMdx(nextConfig);
