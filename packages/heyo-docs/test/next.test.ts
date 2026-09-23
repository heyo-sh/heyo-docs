import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";

import { heyoDocs } from "../src/config";
import { generateNextContent, heyoDocsMdxOptions } from "../src/adapters/next";

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), "heyo-docs-next-"));
  await mkdir(join(root, "content", "assets"), { recursive: true });
  await writeFile(
    join(root, "content", "index.mdx"),
    `---
title: Home
description: Welcome to the docs.
---
# Home

![Diagram](./assets/diagram.svg)

<File src="./assets/reference.pdf" />
`,
  );
  await writeFile(join(root, "content", "assets", "diagram.svg"), "<svg />");
  await writeFile(join(root, "content", "assets", "reference.pdf"), "PDF");
  await writeFile(
    join(root, "content", "openapi.json"),
    JSON.stringify({
      openapi: "3.1.0",
      paths: {
        "/widgets": {
          get: {
            operationId: "listWidgets",
            responses: { "200": { description: "OK" } },
          },
        },
      },
    }),
  );
  return root;
}

test("generates browser-safe Next data, server data, endpoint shards, and local assets", async () => {
  const root = await createFixture();
  const authorize = () => new Response("Forbidden", { status: 403 });

  try {
    await generateNextContent({
      root,
      config: heyoDocs({
        content: "content",
        theme: "moss",
        ai: {
          authorize,
          chat: {
            provider: "openai",
            model: "gpt-5-mini",
            auth: { type: "api-key", token: "server-only-authentication" },
          },
        },
        groups: [
          { group: "Documentation", sections: [{ pages: ["index"] }] },
          { group: "API", sections: [{ schema: "openapi.json" }] },
        ],
      }),
    });

    const [client, server, stylesheet, endpoint] = await Promise.all([
      readFile(join(root, "app", "_heyo-docs", "content.tsx"), "utf8"),
      readFile(join(root, "app", "_heyo-docs", "server.ts"), "utf8"),
      readFile(join(root, "app", "_heyo-docs", "theme.css"), "utf8"),
      readFile(
        join(
          root,
          "public",
          "_heyo-docs",
          "openapi",
          "api",
          "widgets",
          "list-widgets.json",
        ),
        "utf8",
      ),
    ]);

    expect(client).toContain('lazy(() => import("../../content/index.mdx"))');
    expect(client).toContain('"placeholder":"Ask AI about the docs"');
    expect(client).toContain(
      '"copyForLLM":"enabled","openIn":"enabled","chat":',
    );
    expect(client).not.toContain("server-only-authentication");
    expect(client).not.toContain('"provider":"openai"');
    expect(client).not.toContain('"model":"gpt-5-mini"');
    expect(client).not.toContain("authorize");
    expect(server).toContain('"raw":"---\\ntitle: Home');
    expect(server).toContain("# List Widgets");
    expect(stylesheet).toContain(
      '@import "@heyo-sh/heyo-docs/theme/moss.css";',
    );
    expect(stylesheet).toContain(
      `@source ${JSON.stringify(join(root, "content"))};`,
    );
    expect(endpoint).toContain('"slug":"/api/widgets/list-widgets"');
    expect(endpoint).toContain('"operationId":"listWidgets"');
    await expect(
      Bun.file(
        join(
          root,
          "public",
          "_heyo-docs",
          "assets",
          "content",
          "assets",
          "diagram.svg",
        ),
      ).text(),
    ).resolves.toBe("<svg />");
    await expect(
      Bun.file(
        join(
          root,
          "public",
          "_heyo-docs",
          "assets",
          "content",
          "assets",
          "reference.pdf",
        ),
      ).text(),
    ).resolves.toBe("PDF");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("escapes unsafe paths in generated Next dynamic imports", async () => {
  const root = await mkdtemp(join(tmpdir(), "heyo-docs-next-"));
  await mkdir(join(root, "content", "<", "script>"), { recursive: true });
  await writeFile(
    join(root, "content", "<", "script>", "index.mdx"),
    "# Unsafe path\n",
  );

  try {
    await generateNextContent({
      root,
      config: heyoDocs({ content: "content", groups: [] }),
    });

    const client = await readFile(
      join(root, "app", "_heyo-docs", "content.tsx"),
      "utf8",
    );
    expect(client).toContain(
      String.raw`lazy(() => import("../../content/\u003C/script\u003E/index.mdx"))`,
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("configures Next MDX compilation with portable absolute plugins and content root", () => {
  const options = heyoDocsMdxOptions({
    root: "/workspace/docs",
    content: "content",
  });

  expect(options.rehypePlugins).toHaveLength(1);
  expect(options.remarkPlugins).toHaveLength(3);
  expect(options.remarkPlugins[0]).toContain("remark-frontmatter");
  expect(options.remarkPlugins[1]).toContain("remark-gfm");
  expect(options.remarkPlugins[2]).toEqual(
    expect.arrayContaining([
      expect.stringContaining("plugins.js"),
      { root: "/workspace/docs", contentDirectory: "content" },
    ]),
  );
});
