#!/usr/bin/env bun
import * as p from "@clack/prompts";

import {
  detectPackageManager,
  packageManagerRunCommand,
} from "./package-manager";
import { projectNameError } from "./project-name";
import { scaffoldProject } from "./scaffold";
import type { CreateOptions } from "./types";

export {
  detectPackageManager,
  packageManagerField,
  packageManagerRunCommand,
} from "./package-manager";
export { scaffoldProject } from "./scaffold";
export { mergePackageJson, replacePlaceholders } from "./utils";
export type * from "./types";

const USAGE =
  "Usage: create-heyo-docs [project-name] [--template react-router|next|astro] [--deployment cloudflare|vercel|later] [--theme grain|shade|moss] [--package-manager bun|pnpm|npm|yarn] [--no-install]";
const TEMPLATE_OPTIONS = [
  { value: "react-router", label: "React Router" },
  { value: "next", label: "Next.js" },
  { value: "astro", label: "Astro" },
];
const DEPLOYMENT_OPTIONS = [
  { value: "cloudflare", label: "Cloudflare" },
  { value: "vercel", label: "Vercel" },
  { value: "later", label: "Configure later" },
];
const THEME_OPTIONS = [
  { value: "grain", label: "Grain" },
  { value: "shade", label: "Shade" },
  { value: "moss", label: "Moss" },
  {
    value: "dripper",
    label: "Dripper — Soon",
    hint: "Unavailable in this MVP",
  },
  {
    value: "fixed-gear",
    label: "Fixed Gear — Soon",
    hint: "Unavailable in this MVP",
  },
];
const PACKAGE_MANAGER_OPTIONS = [
  { value: "bun", label: "bun" },
  { value: "pnpm", label: "pnpm" },
  { value: "npm", label: "npm" },
  { value: "yarn", label: "yarn" },
];

if (import.meta.main) {
  run(process.argv.slice(2)).catch((error: unknown) => {
    p.log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export async function run(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseArguments(argv);
  if (parsed.showHelp) {
    p.note(USAGE, "@heyo-sh/create-heyo-docs");
    return;
  }
  const options = parsed.interactive
    ? await askQuestions(parsed.options)
    : parsed.options;
  const spinner = p.spinner();
  spinner.start("Creating your Heyo Docs project");
  try {
    await scaffoldProject(options);
  } catch (error) {
    spinner.stop("Unable to create your documentation project");
    throw error;
  }
  spinner.stop("Your documentation project is ready");
  const install = options.install ? "" : `\n${options.packageManager} install`;
  p.note(
    `cd ${options.projectName}${install}\n${packageManagerRunCommand(options.packageManager, "dev")}`,
    "Next steps",
  );
  p.outro("Happy documenting.");
}

export function parseArguments(argv: string[]): {
  options: CreateOptions;
  interactive: boolean;
  showHelp: boolean;
} {
  const detected = detectPackageManager();
  const options: CreateOptions = {
    projectName: "",
    template: "react-router",
    deployment: "later",
    theme: "grain",
    packageManager: detected.name,
    install: true,
  };
  let explicit = false;
  let showHelp = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("-")) {
      options.projectName ||= value;
      continue;
    }
    explicit = true;
    if (value === "--template") {
      options.template = readEnum(
        argv[++index],
        ["react-router", "next", "astro"] as const,
        "template",
      );
    } else if (value === "--deployment") {
      options.deployment = readEnum(
        argv[++index],
        ["cloudflare", "vercel", "later"] as const,
        "deployment",
      );
    } else if (value === "--theme") {
      options.theme = readEnum(
        argv[++index],
        ["grain", "shade", "moss"] as const,
        "theme",
      );
    } else if (value === "--package-manager") {
      options.packageManager = readEnum(
        argv[++index],
        ["bun", "pnpm", "npm", "yarn"] as const,
        "package manager",
      );
    } else if (value === "--no-install") {
      options.install = false;
    } else if (value === "--install") {
      options.install = true;
    } else if (value === "--help" || value === "-h") {
      showHelp = true;
    } else {
      throw new Error(`Unknown option: ${value}`);
    }
  }
  return { options, interactive: !explicit && !options.projectName, showHelp };
}

async function askQuestions(defaults: CreateOptions): Promise<CreateOptions> {
  p.intro("Create Heyo Docs");
  const projectName = await p.text({
    message: "Project name",
    placeholder: "my-docs",
    defaultValue: "my-docs",
    validate: projectNameError,
  });
  if (p.isCancel(projectName)) cancelCreation();

  const template = await selectAvailable("Template", TEMPLATE_OPTIONS, [
    "react-router",
    "next",
    "astro",
  ] as const);
  const deployment = await selectAvailable(
    "Deployment",
    DEPLOYMENT_OPTIONS,
    ["cloudflare", "vercel", "later"] as const,
    defaults.deployment,
  );
  const theme = await selectAvailable("Theme", THEME_OPTIONS, [
    "grain",
    "shade",
    "moss",
  ] as const);
  const packageManager = await selectAvailable(
    "Package manager",
    PACKAGE_MANAGER_OPTIONS,
    ["bun", "pnpm", "npm", "yarn"] as const,
    defaults.packageManager,
  );
  const install = await p.confirm({
    message: "Install dependencies?",
    initialValue: true,
  });
  if (p.isCancel(install)) cancelCreation();

  return {
    projectName,
    template,
    deployment,
    theme,
    packageManager,
    install,
  };
}

async function selectAvailable<T extends string>(
  message: string,
  options: Array<{ value: string; label: string; hint?: string }>,
  available: readonly T[],
  initialValue?: T,
): Promise<T> {
  for (;;) {
    const answer = await p.select<string>({ message, options, initialValue });
    if (p.isCancel(answer)) cancelCreation();
    if (isOneOf(answer, available)) return answer;
    p.log.warn("That option is planned but not available in this MVP.");
  }
}

function isOneOf<T extends string>(
  value: string,
  values: readonly T[],
): value is T {
  return values.some((candidate) => candidate === value);
}

function cancelCreation(): never {
  p.cancel("Creation cancelled.");
  process.exit(0);
}

function readEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  label: string,
): T {
  if (value && isOneOf(value, allowed)) return value;
  throw new Error(`Use one of ${allowed.join(", ")} for ${label}.`);
}
