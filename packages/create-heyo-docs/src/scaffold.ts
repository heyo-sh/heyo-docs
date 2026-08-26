import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import {
  packageManagerField,
  packageManagerInstallCommand,
} from "./package-manager";
import { assertProjectName } from "./project-name";
import type { CreateOptions } from "./types";
import { copyTemplate, mergePackageJson, readJson, writeJson } from "./utils";

const packageRoot = resolve(import.meta.dirname, "..");

export async function scaffoldProject(
  options: CreateOptions,
): Promise<{ projectPath: string }> {
  const cwd = options.cwd ?? process.cwd();
  const projectName = assertProjectName(options.projectName);
  const projectPath = resolve(cwd, projectName);
  if (existsSync(projectPath))
    throw new Error(`Directory already exists: ${projectPath}`);

  const placeholders = {
    PROJECT_NAME: projectName,
    HEYO_DOCS_VERSION: options.heyoDocsVersion ?? "0.1.0",
    PACKAGE_MANAGER: packageManagerField(options.packageManager),
    THEME: options.theme,
  };
  const templatePath = join(packageRoot, "templates", options.template);
  const deploymentPath = join(
    packageRoot,
    "deployments",
    options.deployment,
    options.template,
  );
  await mkdir(projectPath, { recursive: true });
  await copyTemplate(templatePath, projectPath, placeholders);

  const basePackage = await readJson<Record<string, unknown>>(
    join(projectPath, "package.json"),
  );
  const overlayPackage =
    options.deployment === "later"
      ? {}
      : await readJson<Record<string, unknown>>(
          join(deploymentPath, "package.json"),
        );
  if (options.deployment !== "later") {
    await copyOverlay(deploymentPath, projectPath, placeholders);
  }
  await writeJson(
    join(projectPath, "package.json"),
    mergePackageJson(basePackage, overlayPackage),
  );
  if (options.install)
    await installDependencies(projectPath, options.packageManager);
  return { projectPath };
}

async function copyOverlay(
  source: string,
  destination: string,
  placeholders: Record<string, string>,
): Promise<void> {
  const entries = await readdir(source, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.name !== "package.json")
      .map(async (entry) => {
        const sourcePath = join(source, entry.name);
        const destinationPath = join(destination, entry.name);
        return copyTemplate(sourcePath, destinationPath, placeholders);
      }),
  );
}

async function installDependencies(
  projectPath: string,
  packageManager: CreateOptions["packageManager"],
): Promise<void> {
  const command = packageManagerInstallCommand(packageManager);
  const process = Bun.spawn(command, {
    cwd: projectPath,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await process.exited) !== 0)
    throw new Error(
      `Dependency installation failed with ${command.join(" ")}.`,
    );
}
