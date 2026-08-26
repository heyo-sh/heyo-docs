import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

export function replacePlaceholders(
  source: string,
  values: Record<string, string>,
): string {
  return source.replace(
    /\{\{([A-Z0-9_]+)\}\}/g,
    (placeholder, key: string) => values[key] ?? placeholder,
  );
}

export function mergePackageJson<T extends Record<string, unknown>>(
  base: T,
  overlay: Record<string, unknown>,
): T {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const current = merged[key];
    if (isRecord(current) && isRecord(value))
      merged[key] = mergePackageJson(current, value);
    else merged[key] = value;
  }
  return merged as T;
}

export async function copyTemplate(
  source: string,
  destination: string,
  placeholders: Record<string, string>,
): Promise<void> {
  await cp(source, destination, { recursive: true, force: true });
  await replacePlaceholdersAtPath(destination, placeholders);
}

export async function replacePlaceholdersInDirectory(
  directory: string,
  values: Record<string, string>,
): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    entries.map((entry) =>
      replacePlaceholdersAtPath(join(directory, entry.name), values),
    ),
  );
}

async function replacePlaceholdersAtPath(
  path: string,
  values: Record<string, string>,
): Promise<void> {
  if (!(await stat(path)).isDirectory()) {
    const contents = await readFile(path, "utf8");
    await writeFile(path, replacePlaceholders(contents, values));
    return;
  }

  const entries = await readdir(path, { withFileTypes: true });
  await Promise.all(
    entries.map((entry) =>
      replacePlaceholdersAtPath(join(path, entry.name), values),
    ),
  );
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

export async function emptyDirectory(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
