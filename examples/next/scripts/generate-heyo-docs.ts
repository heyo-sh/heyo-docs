import { watch } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { generateNextContent } from "@heyo-sh/heyo-docs/next";

const root = process.cwd();
const configPath = resolve(root, "heyo-docs.config.ts");
let generating = false;
let queued = false;

async function loadConfig() {
  const moduleUrl = `${pathToFileURL(configPath).href}?v=${Date.now()}`;
  return (await import(moduleUrl)).default;
}

async function generate() {
  if (generating) {
    queued = true;
    return;
  }
  generating = true;
  try {
    await generateNextContent({ config: await loadConfig(), root });
  } finally {
    generating = false;
    if (queued) {
      queued = false;
      await generate();
    }
  }
}

await generate();

if (process.argv.includes("--watch")) {
  const config = await loadConfig();
  const watchedPaths = [resolve(root, config.content), configPath];
  const refresh = () => {
    void generate().catch((error: unknown) => {
      console.error(error);
    });
  };
  const watchers = watchedPaths.map((path) =>
    watch(path, { recursive: path !== configPath }, refresh),
  );
  const stop = () => watchers.forEach((watcher) => watcher.close());
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
