import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { heyoDocsMdxOptions } from "@heyo-sh/heyo-docs/next";

const nextConfig: NextConfig = {
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
