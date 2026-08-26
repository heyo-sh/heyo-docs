import type { DetectedPackageManager, PackageManager } from "./types";

const FALLBACK_VERSIONS: Record<PackageManager, string> = {
  bun: "1.3.1",
  pnpm: "10.17.0",
  npm: "11.6.0",
  yarn: "4.9.4",
};

export function detectPackageManager(
  userAgent = process.env.npm_config_user_agent ?? "",
): DetectedPackageManager {
  const match = userAgent.match(/(?:^|\s)(bun|pnpm|npm|yarn)\/([^\s]+)/);
  if (!match) return { name: "bun", version: Bun.version };
  return { name: match[1] as PackageManager, version: match[2] };
}

export function packageManagerField(
  manager: PackageManager,
  detected = detectPackageManager(),
): string {
  if (manager === detected.name && detected.version)
    return `${manager}@${detected.version}`;
  const executable = manager === "yarn" ? "yarn" : manager;
  try {
    const result = Bun.spawnSync([executable, "--version"]);
    const version = new TextDecoder().decode(result.stdout).trim();
    if (result.exitCode === 0 && /^\d+(?:\.\d+)+/.test(version))
      return `${manager}@${version}`;
  } catch {
    // The selected package manager need not be installed on the creator's machine.
  }
  return `${manager}@${FALLBACK_VERSIONS[manager]}`;
}

export function packageManagerInstallCommand(
  manager: PackageManager,
): string[] {
  return manager === "yarn" ? ["yarn"] : [manager, "install"];
}

export function packageManagerRunCommand(
  manager: PackageManager,
  script: string,
): string {
  if (manager === "npm") return `npm run ${script}`;
  if (manager === "yarn") return `yarn ${script}`;
  return `${manager} run ${script}`;
}
