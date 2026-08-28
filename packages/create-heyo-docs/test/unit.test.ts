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
      }
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
