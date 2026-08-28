import {
  afterAll,
  beforeAll,
  describe,
  expect,
  setDefaultTimeout,
  test,
} from "bun:test";
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import { scaffoldProject } from "../src/scaffold";
import type { Deployment } from "../src/types";

const temporaryRoot = (
  await Bun.$`mktemp -d /tmp/heyo-docs-integration.XXXXXX`.text()
).trim();
const root = resolve(import.meta.dir, "../../..");
const runtimeDirectory = join(root, "packages/heyo-docs");
const creatorDirectory = join(root, "packages/create-heyo-docs");
let tarball = "";

// Deleting three fully installed, generated projects can take longer than
// Bun's five-second hook default on slower filesystems.
setDefaultTimeout(30_000);

async function run(command: string[], cwd: string): Promise<void> {
  const process = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await process.exited) !== 0)
    throw new Error(`Failed: ${command.join(" ")}`);
}

beforeAll(async () => {
  await run(["bun", "run", "build"], runtimeDirectory);
  await run(["bun", "run", "build"], creatorDirectory);
  await run(
    ["bun", "pm", "pack", "--destination", temporaryRoot],
    runtimeDirectory,
  );
  const files = await readdir(temporaryRoot);
  tarball = join(
    temporaryRoot,
    files.find((file) => file.endsWith(".tgz"))!,
  );
});

afterAll(async () => {
  await Bun.$`rm -rf ${temporaryRoot}`.quiet();
});

describe.serial("generated React Router projects", () => {
  for (const deployment of ["cloudflare", "later"] as Deployment[]) {
    test(`${deployment} installs and builds`, async () => {
      const name = `docs-${deployment}`;
      const { projectPath } = await scaffoldProject({
        projectName: name,
        template: "react-router",
        deployment,
        theme: "grain",
        packageManager: "bun",
        install: false,
        cwd: temporaryRoot,
        heyoDocsVersion: `file:${tarball}`,
      });
      await run(["bun", "install"], projectPath);
      await run(["bun", "run", "build"], projectPath);
      const packageJson = JSON.parse(
        await Bun.file(join(projectPath, "package.json")).text(),
      ) as {
        dependencies: Record<string, string>;
        scripts: Record<string, string>;
      };
      expect(packageJson.dependencies["@heyo-sh/heyo-docs"]).toBe(
        `file:${tarball}`,
      );
      expect(packageJson.scripts.build).toBe("react-router build");
      expect(
        await Bun.file(join(projectPath, "app/routes.ts")).text(),
      ).toContain("sitemap.xml");
      expect(
        await Bun.file(join(projectPath, "app/routes.ts")).text(),
      ).toContain("rss.xml");
      expect(
        await Bun.file(join(projectPath, "app/routes.ts")).text(),
      ).toContain("robots.txt");
      expect(
        await Bun.file(join(projectPath, "app/routes/robots.ts")).text(),
      ).toContain("Sitemap:");
      expect(
        await Bun.file(join(projectPath, "app/routes/rss.ts")).text(),
      ).toContain("rssXml");
      expect(
        await Bun.file(join(projectPath, "content/index.mdx")).exists(),
      ).toBe(true);
      expect(
        await Bun.file(join(projectPath, "components.json")).text(),
      ).toContain('"style": "base-mira"');
      expect(await Bun.file(join(projectPath, "app/app.css")).text()).toContain(
        "@heyo-sh/heyo-docs/theme/grain.css",
      );
      expect(await Bun.file(join(projectPath, "app/app.css")).text()).toContain(
        '@import "@fontsource-variable/figtree"',
      );
      expect(
        await Bun.file(join(projectPath, "app/heyo-docs-icons.tsx")).text(),
      ).toContain('from "@remixicon/react"');
      expect(
        await Bun.file(join(projectPath, "app/root.tsx")).text(),
      ).toContain('import "./app.css"');
      const rootSource = await Bun.file(
        join(projectPath, "app/root.tsx"),
      ).text();
      expect(rootSource).toContain("ThemeProvider");
      expect(rootSource).toContain(
        "getThemeScript(THEME_STORAGE_KEY, config.mode)",
      );
      const docsRouteSource = await Bun.file(
        join(projectPath, "app/routes/docs.tsx"),
      ).text();
      expect(docsRouteSource).toContain("iconSet={iconSet}");
      expect(docsRouteSource).toContain("useTheme");
      expect(docsRouteSource).toContain("onThemeToggle");
      expect(docsRouteSource).toContain('"script:ld+json"');
      expect(docsRouteSource).toContain('"@type": "WebSite"');
      expect(docsRouteSource).toContain('"@type": "TechArticle"');
      const serverEntries: string[] = [];
      for await (const entry of new Bun.Glob("build/server/**/index.js").scan({
        cwd: projectPath,
      }))
        serverEntries.push(entry);
      expect(serverEntries.length).toBeGreaterThan(0);
      expect(
        await Bun.file(join(projectPath, "react-router.config.ts")).text(),
      ).toContain("prerender");
      if (deployment === "cloudflare") {
        expect(
          await Bun.file(join(projectPath, "wrangler.jsonc")).exists(),
        ).toBe(true);
        expect(packageJson.scripts.deploy).toBe("wrangler deploy");
      }
      if (deployment === "vercel") {
        expect(await Bun.file(join(projectPath, "vercel.json")).exists()).toBe(
          true,
        );
        expect(packageJson.scripts.deploy).toBe("vercel --prod");
      }
      if (deployment === "later")
        expect(packageJson.scripts.deploy).toBeUndefined();
    }, 180_000);
  }
});

describe.serial("generated Astro projects", () => {
  for (const deployment of ["cloudflare", "vercel", "later"] as Deployment[]) {
    test(`${deployment} installs and builds`, async () => {
      const name = `astro-docs-${deployment}`;
      const { projectPath } = await scaffoldProject({
        projectName: name,
        template: "astro",
        deployment,
        theme: "grain",
        packageManager: "bun",
        install: false,
        cwd: temporaryRoot,
        heyoDocsVersion: `file:${tarball}`,
      });
      await run(["bun", "install"], projectPath);
      await run(["bun", "run", "build"], projectPath);
      const packageJson = JSON.parse(
        await Bun.file(join(projectPath, "package.json")).text(),
      ) as {
        dependencies: Record<string, string>;
        scripts: Record<string, string>;
      };
      expect(packageJson.dependencies["@heyo-sh/heyo-docs"]).toBe(
        `file:${tarball}`,
      );
      expect(packageJson.scripts.build).toBe("astro build");
      expect(
        await Bun.file(join(projectPath, "astro.config.ts")).text(),
      ).toContain("heyoDocsAstro({ config })");
      expect(
        await Bun.file(join(projectPath, "src/pages/robots.txt.ts")).text(),
      ).toContain("Sitemap:");
      expect(
        await Bun.file(join(projectPath, "src/pages/sitemap.xml.ts")).text(),
      ).toContain("sitemapXml");
      expect(
        await Bun.file(join(projectPath, "src/pages/rss.xml.ts")).text(),
      ).toContain("rssXml");
      expect(
        await Bun.file(join(projectPath, "src/pages/llms.txt.ts")).exists(),
      ).toBe(true);
      expect(
        await Bun.file(
          join(projectPath, "src/pages/llms-full.txt.ts"),
        ).exists(),
      ).toBe(true);
      expect(
        await Bun.file(join(projectPath, "src/pages/[...slug].md.ts")).exists(),
      ).toBe(true);
      expect(
        await Bun.file(
          join(projectPath, "src/pages/heyo-docs-internal/openapi-request.ts"),
        ).text(),
      ).toContain("prerender = false");
      expect(
        await Bun.file(join(projectPath, "astro.config.ts")).text(),
      ).toContain('output: "static"');
      expect(
        await Bun.file(join(projectPath, "content/index.mdx")).exists(),
      ).toBe(true);
      expect(
        await Bun.file(join(projectPath, "components.json")).text(),
      ).toContain('"style": "base-mira"');
      expect(
        await Bun.file(join(projectPath, "src/styles/app.css")).text(),
      ).toContain("@heyo-sh/heyo-docs/theme/grain.css");
      expect(
        await Bun.file(join(projectPath, "src/heyo-docs-icons.tsx")).text(),
      ).toContain('from "@remixicon/react"');
      if (deployment === "cloudflare") {
        expect(
          await Bun.file(join(projectPath, "wrangler.jsonc")).exists(),
        ).toBe(true);
        expect(packageJson.scripts.deploy).toBe(
          "wrangler deploy --config dist/server/wrangler.json",
        );
        expect(
          await Bun.file(
            join(projectPath, "dist/server/wrangler.json"),
          ).exists(),
        ).toBe(true);
      }
      if (deployment === "vercel") {
        expect(await Bun.file(join(projectPath, "vercel.json")).exists()).toBe(
          true,
        );
        expect(packageJson.scripts.deploy).toBe("vercel --prod");
        expect(
          await Bun.file(
            join(projectPath, ".vercel/output/config.json"),
          ).exists(),
        ).toBe(true);
      }
      if (deployment === "later") {
        expect(packageJson.scripts.deploy).toBeUndefined();
        expect(
          await Bun.file(join(projectPath, "dist/server/entry.mjs")).exists(),
        ).toBe(true);
      }
    }, 180_000);
  }
});

describe.serial("generated Next.js projects", () => {
  for (const deployment of ["cloudflare", "vercel", "later"] as Deployment[]) {
    test(`${deployment} installs and builds`, async () => {
      // A lockfile in an ancestor directory used to make Turbopack choose that
      // directory as its root instead of the generated project's directory.
      await Bun.write(join(temporaryRoot, "package-lock.json"), "{}\n");
      const name = `next-docs-${deployment}`;
      const { projectPath } = await scaffoldProject({
        projectName: name,
        template: "next",
        deployment,
        theme: "grain",
        packageManager: "bun",
        install: false,
        cwd: temporaryRoot,
        heyoDocsVersion: `file:${tarball}`,
      });
      await run(["bun", "install"], projectPath);
      await run(["bun", "run", "typecheck"], projectPath);
      await run(["bun", "run", "build"], projectPath);
      const packageJson = JSON.parse(
        await Bun.file(join(projectPath, "package.json")).text(),
      ) as {
        dependencies: Record<string, string>;
        scripts: Record<string, string>;
      };
      expect(packageJson.dependencies["@heyo-sh/heyo-docs"]).toBe(
        `file:${tarball}`,
      );
      expect(packageJson.scripts.build).toContain("next build");
      expect(packageJson.scripts.build).not.toContain("--webpack");
      expect(
        await Bun.file(join(projectPath, "app/robots.txt/route.ts")).text(),
      ).toContain("Sitemap:");
      expect(
        await Bun.file(join(projectPath, "app/sitemap.xml/route.ts")).text(),
      ).toContain("sitemapXml");
      expect(
        await Bun.file(join(projectPath, "app/rss.xml/route.ts")).text(),
      ).toContain("rssXml");
      expect(
        await Bun.file(join(projectPath, "app/llms.txt/route.ts")).exists(),
      ).toBe(true);
      expect(
        await Bun.file(
          join(projectPath, "app/llms-full.txt/route.ts"),
        ).exists(),
      ).toBe(true);
      expect(
        await Bun.file(
          join(
            projectPath,
            "app/heyo-docs-internal/markdown/[[...slug]]/route.ts",
          ),
        ).exists(),
      ).toBe(true);
      const nextConfig = await Bun.file(
        join(projectPath, "next.config.ts"),
      ).text();
      expect(nextConfig).toContain("heyoDocsMdxOptions");
      expect(nextConfig).toContain("turbopack: {");
      expect(nextConfig).toContain("root: projectRoot,");
      expect(nextConfig).toContain('source: "/:path*.md"');
      expect(nextConfig).toContain(
        'destination: "/heyo-docs-internal/markdown/:path*"',
      );
      expect(await Bun.file(join(projectPath, "proxy.ts")).exists()).toBe(
        false,
      );
      expect(
        await Bun.file(
          join(projectPath, "scripts/generate-heyo-docs.ts"),
        ).text(),
      ).toContain("generateNextContent");
      expect(
        await Bun.file(join(projectPath, "content/index.mdx")).exists(),
      ).toBe(true);
      expect(
        await Bun.file(join(projectPath, "components.json")).text(),
      ).toContain('"style": "base-mira"');
      expect(await Bun.file(join(projectPath, "app/app.css")).text()).toContain(
        "@heyo-sh/heyo-docs/theme/grain.css",
      );
      expect(
        await Bun.file(join(projectPath, "app/heyo-docs-icons.tsx")).text(),
      ).toContain('from "@remixicon/react"');
      expect(
        await Bun.file(join(projectPath, ".next/server/app/page.js")).exists(),
      ).toBe(false);
      expect(
        await Bun.file(
          join(projectPath, ".next/server/app/[[...slug]]/page.js"),
        ).exists(),
      ).toBe(true);
      expect(
        await Bun.file(join(projectPath, "app/[[...slug]]/page.tsx")).text(),
      ).toContain('dynamic = "force-static"');
      expect(
        await Bun.file(
          join(projectPath, "app/heyo-docs-internal/openapi-request/route.ts"),
        ).exists(),
      ).toBe(true);
      if (deployment === "cloudflare") {
        await run(["bun", "x", "opennextjs-cloudflare", "build"], projectPath);
        expect(
          await Bun.file(join(projectPath, "wrangler.jsonc")).exists(),
        ).toBe(true);
        expect(packageJson.scripts.deploy).toBe(
          "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
        );
        expect(
          await Bun.file(join(projectPath, "open-next.config.ts")).text(),
        ).toContain("defineCloudflareConfig");
        expect(
          await Bun.file(join(projectPath, ".open-next/worker.js")).exists(),
        ).toBe(true);
      }
      if (deployment === "vercel") {
        expect(await Bun.file(join(projectPath, "vercel.json")).exists()).toBe(
          true,
        );
        expect(packageJson.scripts.deploy).toBe("vercel --prod");
      }
      if (deployment === "later")
        expect(packageJson.scripts.deploy).toBeUndefined();
    }, 180_000);
  }
});
