import { expect, test } from "bun:test";

import { heyoDocs } from "../src/config";
import { heyoDocsAstro } from "../src/astro";

test("registers the Vite content adapter through Astro's integration hook", () => {
  const integration = heyoDocsAstro({
    config: heyoDocs({ content: "./content" }),
  });
  let receivedConfig: unknown;

  integration.hooks["astro:config:setup"]({
    updateConfig(config) {
      receivedConfig = config;
    },
  });

  expect(integration.name).toBe("heyo-docs:astro");
  expect(receivedConfig).toMatchObject({
    vite: { plugins: [{ name: "heyo-docs:content", enforce: "pre" }] },
  });
});
