import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  detectPackageManager,
  packageManagerField,
} from "../src/package-manager";
import { projectNameError } from "../src/project-name";
import { parseArguments } from "../src/index";
import { scaffoldProject } from "../src/scaffold";
import { mergePackageJson, replacePlaceholders } from "../src/utils";

describe("creator utilities", () => {
  test("detects the invoking package manager", () => {
    expect(detectPackageManager("pnpm/10.17.0 npm/? node/v24")).toEqual({
      name: "pnpm",
      version: "10.17.0",
    });
    expect(detectPackageManager("bun/1.3.1 npm/?")).toEqual({
      name: "bun",
      version: "1.3.1",
    });
    expect(packageManagerField("bun", { name: "bun", version: "1.3.1" })).toBe(
      "bun@1.3.1",
    );
    expect(detectPackageManager("")).toEqual({ name: "npm" });
  });

  test("merges package JSON fragments without losing scripts", () => {
    const base: Record<string, unknown> = {
      scripts: { build: "build" },
      dependencies: { react: "1" },
    };
    expect(
      mergePackageJson(base, {
        scripts: { deploy: "deploy" },
        dependencies: { heyo: "1" },
      }),
    ).toEqual({
      scripts: { build: "build", deploy: "deploy" },
      dependencies: { react: "1", heyo: "1" },
    });
  });

  test("replaces only declared placeholders", () => {
    expect(replacePlaceholders("{{NAME}} {{KEEP}}", { NAME: "docs" })).toBe(
      "docs {{KEEP}}",
    );
  });

  test("scaffolds every template with the latest published runtime by default", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-heyo-docs-"));
    try {
      for (const template of ["react-router", "next", "astro"] as const) {
        const { projectPath } = await scaffoldProject({
          projectName: `docs-${template}`,
          template,
          deployment: "later",
          theme: "grain",
          packageManager: "bun",
          install: false,
          cwd,
        });
        const packageJson = JSON.parse(
          await readFile(join(projectPath, "package.json"), "utf8"),
        ) as { dependencies: Record<string, string> };

        expect(packageJson.dependencies["@heyo-sh/heyo-docs"]).toBe("latest");

        const layoutPath =
          template === "next"
            ? join(projectPath, "app/layout.tsx")
            : template === "react-router"
              ? join(projectPath, "app/root.tsx")
              : join(projectPath, "src/layouts/docs-layout.astro");
        const layout = await readFile(layoutPath, "utf8");
        expect(layout).toContain("integrations/analytics/adobe");
        expect(layout).toContain("integrations/analytics/amplitude");
        expect(layout).toContain("integrations/analytics/clarity");
        expect(layout).toContain("integrations/analytics/clearbit");
        expect(layout).toContain("integrations/analytics/fathom");
        expect(layout).toContain("integrations/analytics/google-analytics");
        expect(layout).toContain("integrations/analytics/google-tag-manager");
        expect(layout).toContain("integrations/analytics/heap");
        expect(layout).toContain("integrations/analytics/hotjar");
        expect(layout).toContain("integrations/analytics/logrocket");
        expect(layout).toContain("integrations/analytics/mixpanel");
        expect(layout).toContain("integrations/analytics/openpanel");
        expect(layout).toContain("integrations/analytics/openreplay");
        expect(layout).toContain("integrations/analytics/pirsch");
        expect(layout).toContain("integrations/analytics/plausible");
        expect(layout).toContain("integrations/analytics/posthog");
        expect(layout).toContain("integrations/analytics/rybbit");
        expect(layout).toContain("integrations/analytics/swetrix");
        expect(layout).toContain("integrations/analytics/umami");
        expect(layout).toContain("integrations/support/chaskiq");
        expect(layout).toContain("integrations/support/chatwoot");
        expect(layout).toContain("integrations/support/front");
        expect(layout).toContain("integrations/support/intercom");
        expect(layout).toContain("integrations/support/papercups");
        expect(layout).toContain("integrations/support/typebot");
        expect(layout).toContain("integrations/support/zammad");
        expect(layout).toContain("integrations/consent/osano");
        expect(layout).toContain("integrations/consent/transcend");
        expect(layout).toContain("config.integrations.consent.osano");
        expect(layout).toContain("config.integrations.consent.transcend");
        expect(layout).toContain("config.integrations.analytics.adobe");
        expect(layout).toContain("config.integrations.analytics.amplitude");
        expect(layout).toContain("config.integrations.analytics.clarity");
        expect(layout).toContain("config.integrations.analytics.clearbit");
        expect(layout).toContain("config.integrations.analytics.fathom");
        expect(layout).toContain("config.integrations.analytics.ga4");
        expect(layout).toContain("config.integrations.analytics.gtm");
        expect(layout).toContain("config.integrations.analytics.heap");
        expect(layout).toContain("config.integrations.analytics.hotjar");
        expect(layout).toContain("config.integrations.analytics.logrocket");
        expect(layout).toContain("config.integrations.analytics.mixpanel");
        expect(layout).toContain("config.integrations.analytics.openpanel");
        expect(layout).toContain("config.integrations.analytics.openreplay");
        expect(layout).toContain("config.integrations.analytics.pirsch");
        expect(layout).toContain("config.integrations.analytics.plausible");
        expect(layout).toContain("config.integrations.analytics.posthog");
        expect(layout).toContain("config.integrations.analytics.rybbit");
        expect(layout).toContain("config.integrations.analytics.swetrix");
        expect(layout).toContain("config.integrations.analytics.umami");
        expect(layout).toContain("config.integrations.support.chaskiq");
        expect(layout).toContain("config.integrations.support.chatwoot");
        expect(layout).toContain("config.integrations.support.front");
        expect(layout).toContain("config.integrations.support.intercom");
        expect(layout).toContain("config.integrations.support.papercups");
        expect(layout).toContain("config.integrations.support.typebot");
        expect(layout).toContain("config.integrations.support.zammad");
        expect(layout).toContain("data-intercom-app-id");
        expect(layout).toContain("data-intercom-api-base");
        expect(layout).toContain("data-front-chat-id");
        expect(layout).toContain("data-chatwoot-website-token");
        expect(layout).toContain("data-chaskiq-app-id");
        expect(layout).toContain("data-papercups-token");
        expect(layout).toContain("data-heyo-typebot");
        expect(layout).toContain("data-zammad-chat-id");
        expect(layout).toContain("data-google-tag-manager-container-id");
        expect(layout).toContain("googleTagManagerNoScript");
        expect(layout).toContain("data-google-analytics-measurement-id");
        expect(layout).toContain("data-heap-environment-id");

        const osanoScript =
          template === "astro"
            ? "{osano && <script is:inline src={osano.src} />}"
            : "{osano && <script src={osano.src} />}";
        const adobeScript =
          template === "astro"
            ? "{adobe && <script is:inline async src={adobe.src} />}"
            : "{adobe && <script async={adobe.async} src={adobe.src} />}";
        const osanoIndex = layout.indexOf(osanoScript);
        const transcendIndex = layout.indexOf("transcend && (");
        const transcendDefaultsIndex = layout.indexOf(
          "transcendGoogleConsentDefaults && (",
        );
        const headIndex = layout.indexOf("<head>");
        const firstMetadataIndex = layout.indexOf(
          template === "astro"
            ? '<meta charset="utf-8" />'
            : template === "next"
              ? '<meta name="color-scheme" content="light dark" />'
              : '<meta charSet="utf-8" />',
        );
        const themeIndex = layout.lastIndexOf("getThemeScript(");
        const adobeIndex = layout.indexOf(adobeScript);
        const intercomIndex = layout.indexOf("intercom && (");

        expect(osanoIndex).toBeGreaterThan(-1);
        expect(transcendIndex).toBeGreaterThan(-1);
        expect(transcendDefaultsIndex).toBeGreaterThan(-1);
        expect(headIndex).toBeGreaterThan(-1);
        expect(firstMetadataIndex).toBeGreaterThan(-1);
        expect(themeIndex).toBeGreaterThan(-1);
        expect(adobeIndex).toBeGreaterThan(-1);
        expect(intercomIndex).toBeGreaterThan(-1);
        expect(osanoIndex).toBeLessThan(themeIndex);
        expect(transcendIndex).toBeLessThan(osanoIndex);
        expect(headIndex).toBeLessThan(transcendDefaultsIndex);
        expect(transcendDefaultsIndex).toBeLessThan(transcendIndex);
        expect(transcendIndex).toBeLessThan(firstMetadataIndex);
        expect(osanoIndex).toBeLessThan(adobeIndex);
        expect(osanoIndex).toBeLessThan(intercomIndex);
      }
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  test("configures Yarn projects to use node_modules", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-heyo-docs-"));
    try {
      const { projectPath } = await scaffoldProject({
        projectName: "docs-next",
        template: "next",
        deployment: "later",
        theme: "grain",
        packageManager: "yarn",
        install: false,
        cwd,
      });

      expect(await readFile(join(projectPath, ".yarnrc.yml"), "utf8")).toBe(
        "nodeLinker: node-modules\n",
      );
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  test("rejects React Router projects configured for Vercel", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "create-heyo-docs-"));
    try {
      await expect(
        scaffoldProject({
          projectName: "docs-react-router",
          template: "react-router",
          deployment: "vercel",
          theme: "grain",
          packageManager: "bun",
          install: false,
          cwd,
        }),
      ).rejects.toThrow("Vercel does not support React Router 8 yet.");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  test("parses non-interactive creator options", () => {
    expect(
      parseArguments([
        "my-docs",
        "--template",
        "react-router",
        "--deployment",
        "vercel",
        "--theme",
        "grain",
        "--package-manager",
        "bun",
        "--no-install",
      ]),
    ).toMatchObject({
      interactive: false,
      showHelp: false,
      options: {
        projectName: "my-docs",
        template: "react-router",
        deployment: "vercel",
        theme: "grain",
        packageManager: "bun",
        install: false,
      },
    });
  });

  test("accepts Astro as an available template", () => {
    expect(
      parseArguments([
        "my-docs",
        "--template",
        "astro",
        "--package-manager",
        "bun",
        "--no-install",
      ]),
    ).toMatchObject({
      interactive: false,
      options: { template: "astro" },
    });
  });

  test("accepts Shade as an available theme", () => {
    expect(
      parseArguments([
        "my-docs",
        "--theme",
        "shade",
        "--package-manager",
        "bun",
        "--no-install",
      ]),
    ).toMatchObject({
      interactive: false,
      showHelp: false,
      options: { theme: "shade" },
    });
  });

  test("accepts Moss as an available theme", () => {
    expect(
      parseArguments([
        "my-docs",
        "--theme",
        "moss",
        "--package-manager",
        "bun",
        "--no-install",
      ]),
    ).toMatchObject({
      interactive: false,
      showHelp: false,
      options: { theme: "moss" },
    });
  });

  test("accepts Next.js as an available template", () => {
    expect(
      parseArguments([
        "my-docs",
        "--template",
        "next",
        "--package-manager",
        "bun",
        "--no-install",
      ]),
    ).toMatchObject({
      interactive: false,
      options: { template: "next" },
    });
  });

  test("validates the project directory name consistently", () => {
    expect(projectNameError("my-docs")).toBeUndefined();
    expect(projectNameError("../my-docs")).toBe(
      "Use letters, numbers and hyphens only.",
    );
  });
});
