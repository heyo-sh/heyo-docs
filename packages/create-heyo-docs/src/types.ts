export type Template = "react-router" | "next" | "astro";
export type Deployment = "cloudflare" | "vercel" | "later";
export type Theme = "grain" | "shade" | "moss";
export type PackageManager = "bun" | "pnpm" | "npm" | "yarn";

export interface CreateOptions {
  projectName: string;
  template: Template;
  deployment: Deployment;
  theme: Theme;
  packageManager: PackageManager;
  install: boolean;
  cwd?: string;
  heyoDocsVersion?: string;
}

export interface DetectedPackageManager {
  name: PackageManager;
  version?: string;
}
