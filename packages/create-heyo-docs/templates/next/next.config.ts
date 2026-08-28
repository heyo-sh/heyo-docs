import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { heyoDocsMdxOptions } from "@heyo-sh/heyo-docs/next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:path*.md",
          destination: "/heyo-docs-internal/markdown/:path*",
        },
      ],
    };
  },
};

const withMdx = createMDX({
  options: heyoDocsMdxOptions({ root: process.cwd() }) as never,
});

export default withMdx(nextConfig);
