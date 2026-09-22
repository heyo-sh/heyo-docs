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

// Deleting every fully installed generated project can take longer than
// Bun's five-second hook default on slower filesystems.
setDefaultTimeout(120_000);

async function run(command: string[], cwd: string): Promise<void> {
  const process = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await process.exited) !== 0)
    throw new Error(`Failed: ${command.join(" ")}`);
}

/** Smoke-tests every non-CSS subpath from the packed runtime, not just paths
 * currently used by a framework template. */
async function verifyPublishedRuntimeEntrypoints(
  projectPath: string,
): Promise<void> {
  const packageJson = JSON.parse(
    await Bun.file(
      join(projectPath, "node_modules/@heyo-sh/heyo-docs/package.json"),
    ).text(),
  ) as { exports: Record<string, unknown> };
  const entrypoints = Object.keys(packageJson.exports).filter(
    (entrypoint) => !entrypoint.includes("*") && !entrypoint.endsWith(".css"),
  );
  const script = `const entrypoints = ${JSON.stringify(entrypoints)};
for (const entrypoint of entrypoints) {
  const specifier = entrypoint === "."
    ? "@heyo-sh/heyo-docs"
    : "@heyo-sh/heyo-docs/" + entrypoint.slice(2);
  await import(specifier);
}`;

  await run(["bun", "--eval", script], projectPath);
}

/** Confirms Tailwind scanned utility classes from the packaged theme chunks. */
async function expectBuiltThemeUtilities(
  projectPath: string,
  cssDirectory: string,
): Promise<void> {
  const stylesheets: string[] = [];
  const buildDirectory = join(projectPath, cssDirectory);
  for await (const file of new Bun.Glob("**/*.css").scan({
    cwd: buildDirectory,
  }))
    stylesheets.push(await Bun.file(join(buildDirectory, file)).text());

  expect(stylesheets.length).toBeGreaterThan(0);
  // This utility belongs to a shared DocsApp chunk rather than the root or
  // theme entrypoint. Its presence prevents a regression where Tailwind only
  // scanned dist/index.js and shipped a partially unstyled theme.
  expect(stylesheets.join("\n")).toContain("sm\\:grid-cols-2");
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
      await verifyPublishedRuntimeEntrypoints(projectPath);
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
      await expectBuiltThemeUtilities(projectPath, "build/client");
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
        await Bun.file(join(projectPath, "app/routes/home.tsx")).text(),
      ).toContain('firstPage.slug === "/"');
      expect(
        await Bun.file(join(projectPath, "components.json")).text(),
      ).toContain('"style": "base-mira"');
      expect(
        await Bun.file(join(projectPath, "app/root.tsx")).text(),
      ).toContain('import "virtual:heyo-docs-theme.css"');
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
      expect(rootSource).toContain("IntegrationScripts");
      expect(rootSource).toContain("themeBootstrapScript");
      expect(rootSource).toContain("siteSeoMeta(config)");
      const docsRouteSource = await Bun.file(
        join(projectPath, "app/routes/docs.tsx"),
      ).text();
      expect(docsRouteSource).toContain("iconSet={iconSet}");
      expect(docsRouteSource).toContain("useDocsTheme");
      expect(docsRouteSource).toContain("onThemeToggle");
      expect(docsRouteSource).toContain(
        'from "@heyo-sh/heyo-docs/seo/react-router"',
      );
      expect(docsRouteSource).toContain("docsSeoMeta(");
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
      await expectBuiltThemeUtilities(projectPath, "dist/client");
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
        await Bun.file(join(projectPath, "src/pages/index.astro")).text(),
      ).toContain("<AstroDocsApp client:load pathname={pathname} />");
      expect(
        await Bun.file(join(projectPath, "components.json")).text(),
      ).toContain('"style": "base-mira"');
      expect(
        await Bun.file(
          join(projectPath, "src/layouts/docs-layout.astro"),
        ).text(),
      ).toContain('import "virtual:heyo-docs-theme.css"');
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
        expect(packageJson.scripts.start).toBe("vercel dev");
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
      await expectBuiltThemeUtilities(projectPath, ".next/static");
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
      expect(nextConfig).toContain("serverExternalPackages: [");
      expect(nextConfig).toContain('"@mariozechner/pi-ai"');
      expect(nextConfig).toContain("turbopack: {");
      expect(nextConfig).toContain("root: projectRoot,");
      expect(nextConfig).toContain('source: "/:path*.md"');
      expect(nextConfig).toContain(
        'destination: "/heyo-docs-internal/markdown/:path*.md"',
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
      const nextLayoutSource = await Bun.file(
        join(projectPath, "app/layout.tsx"),
      ).text();
      expect(nextLayoutSource).toContain('import "./_heyo-docs/theme.css"');
      expect(nextLayoutSource).toContain("nextSiteSeo(config)");
      expect(
        await Bun.file(join(projectPath, "app/heyo-docs-icons.tsx")).text(),
      ).toContain('from "@remixicon/react"');
      expect(
        await Bun.file(join(projectPath, "app/[[...slug]]/page.tsx")).text(),
      ).toContain("redirect(firstPage.slug)");
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
