import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";

import { heyoDocs as defineHeyoDocs } from "../src/config";
import { heyoDocs } from "../src/vite";

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), "heyo-docs-vite-"));
  await mkdir(join(root, "content"));
  await writeFile(join(root, "content", "index.mdx"), "# Home\n");
  return root;
}

test("resolves a bare content directory from an app root in a monorepo", async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), "heyo-docs-workspace-"));
  const appRoot = join(workspaceRoot, "apps", "docs");
  await mkdir(join(appRoot, "content"), { recursive: true });
  await writeFile(join(appRoot, "content", "index.mdx"), "# Home\n");

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({ content: "content" }),
    });
    plugin.configResolved({ command: "build", root: appRoot });
    const id = plugin.resolveId("virtual:heyo-docs-content");

    await expect(plugin.load(id!)).resolves.toContain('slug: "/"');
  } finally {
    await rm(workspaceRoot, { force: true, recursive: true });
  }
});

async function createAssetFixture() {
  const root = await createFixture();
  await mkdir(join(root, "content", "assets"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "content", "assets", "diagram.svg"), "<svg />");
  await writeFile(
    join(root, "content", "assets", "diagram-dark.svg"),
    "<svg />",
  );
  await writeFile(join(root, "content", "assets", "guide.pdf"), "PDF");
  await writeFile(join(root, "content", "assets", "product-tour.mp4"), "VIDEO");
  await writeFile(
    join(root, "content", "assets", "product-tour-poster.png"),
    "PNG",
  );
  await writeFile(join(root, "src", "brand.svg"), "<svg />");
  await writeFile(
    join(root, "content", "index.mdx"),
    `# Home

import brand from "../src/brand.svg"

![Diagram](./assets/diagram.svg)

<Image src="../src/brand.svg" alt="Brand" />

<Image src={brand} alt="Imported brand" />

<Image
  src="./assets/diagram.svg"
  lightSrc="./assets/diagram.svg"
  darkSrc="./assets/diagram-dark.svg"
  alt="A diagram that adapts to the reader's color mode"
/>

<File src="./assets/guide.pdf" name="Quick reference" />

<Video
  src="./assets/product-tour.mp4"
  poster="./assets/product-tour-poster.png"
  caption="A product tour"
/>

[Download the guide](./assets/guide.pdf)

![Public](/images/public.svg)

\`\`\`ts title="app/routes/markdown.ts"
export const markdown = true;
\`\`\`
`,
  );
  return root;
}

async function createOpenApiFixture() {
  const root = await createFixture();
  await writeFile(
    join(root, "content", "openapi.json"),
    JSON.stringify({
      openapi: "3.1.0",
      paths: {
        "/planets": {
          get: {
            operationId: "listPlanets",
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Planet" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Planet: {
            properties: {
              id: { type: "string" },
              moon: { $ref: "#/components/schemas/Moon" },
            },
            type: "object",
          },
          Moon: { properties: { name: { type: "string" } }, type: "object" },
          Unused: { properties: { ignored: { type: "boolean" } } },
        },
      },
    }),
  );
  return root;
}

function pluginFor(root: string, command: "build" | "serve") {
  const plugin = heyoDocs({
    config: defineHeyoDocs({
      content: "./content",
      groups: [
        {
          group: "Changelog",
          type: "changelog",
          updates: ["missing"],
        },
      ],
    }),
  });
  plugin.configResolved({ command, root });
  return plugin;
}

test("warns in development when a changelog reference cannot be resolved", async () => {
  const root = await createFixture();
  const warning = console.warn;
  const warnings: string[] = [];
  console.warn = (...values: unknown[]) => warnings.push(values.join(" "));

  try {
    const plugin = pluginFor(root, "serve");
    const id = plugin.resolveId("virtual:heyo-docs-content");
    await expect(plugin.load(id!)).resolves.toContain("export const pages");
    expect(warnings.join("\n")).toContain(
      'could not resolve changelog reference "missing"',
    );
  } finally {
    console.warn = warning;
    await rm(root, { force: true, recursive: true });
  }
});

test("fails the build when a changelog reference cannot be resolved", async () => {
  const root = await createFixture();

  try {
    const plugin = pluginFor(root, "build");
    const id = plugin.resolveId("virtual:heyo-docs-content");
    await expect(plugin.load(id!)).rejects.toThrow(
      'could not resolve changelog reference "missing"',
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("invalidates cached virtual modules when MDX content changes", async () => {
  const root = await createFixture();

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({ content: "./content", groups: [] }),
    });
    plugin.configResolved({ command: "serve", root });
    const contentId = plugin.resolveId("virtual:heyo-docs-content")!;
    const serverContentId = plugin.resolveId(
      "virtual:heyo-docs-content/server",
    )!;
    const mdxId = plugin.resolveId("virtual:heyo-docs-mdx:index.mdx")!;

    await Promise.all([
      plugin.load(contentId),
      plugin.load(serverContentId),
      plugin.load(mdxId),
    ]);

    const contentModule = { id: contentId };
    const serverContentModule = { id: serverContentId };
    const mdxModule = { id: mdxId };
    const modules = new Map([
      [contentId, contentModule],
      [serverContentId, serverContentModule],
      [mdxId, mdxModule],
    ]);

    expect(
      plugin.handleHotUpdate!({
        file: join(root, "content", "index.mdx"),
        server: { moduleGraph: { getModuleById: (id) => modules.get(id) } },
      }),
    ).toEqual([contentModule, serverContentModule, mdxModule]);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("loads configured JSON OpenAPI documents into a browser virtual module", async () => {
  const root = await createOpenApiFixture();

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({
        content: "./content",
        groups: [{ group: "API", sections: [{ schema: "./openapi.json" }] }],
      }),
    });
    plugin.configResolved({ command: "build", root });
    const id = plugin.resolveId("virtual:heyo-docs-openapi");
    const module = await plugin.load(id!);

    expect(module).toContain("openApiDocuments");
    expect(module).toContain("listPlanets");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("keeps complete OpenAPI documents out of the Vite browser environment", async () => {
  const root = await createOpenApiFixture();

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({
        content: "./content",
        groups: [{ group: "API", sections: [{ schema: "./openapi.json" }] }],
      }),
    });
    plugin.configResolved({ command: "build", root });
    const id = plugin.resolveId("virtual:heyo-docs-openapi");
    const clientModule = await plugin.load.call(
      { environment: { config: { consumer: "client" } } },
      id!,
    );
    const serverModule = await plugin.load.call(
      { environment: { config: { consumer: "server" } } },
      id!,
    );

    expect(clientModule).not.toContain("listPlanets");
    expect(serverModule).toContain("listPlanets");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("emits one compact, static JSON asset for every OpenAPI endpoint", async () => {
  const root = await createOpenApiFixture();

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({
        content: "./content",
        groups: [{ group: "API", sections: [{ schema: "./openapi.json" }] }],
      }),
    });
    plugin.configResolved({ command: "build", root });
    const assets: Array<{ fileName: string; source: string }> = [];

    await plugin.generateBundle!.call({
      emitFile: (asset) => assets.push(asset),
      environment: { config: { consumer: "client" } },
    });

    expect(assets).toHaveLength(1);
    expect(assets[0]?.fileName).toBe(
      "_heyo-docs/openapi/api/planets/list-planets.json",
    );
    expect(assets[0]?.source).toContain('"Planet"');
    expect(assets[0]?.source).toContain('"Moon"');
    expect(assets[0]?.source).not.toContain('"Unused"');
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("serves the same OpenAPI endpoint JSON in Vite development", async () => {
  const root = await createOpenApiFixture();

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({
        content: "./content",
        groups: [{ group: "API", sections: [{ schema: "./openapi.json" }] }],
      }),
    });
    plugin.configResolved({ command: "serve", root });
    let middleware:
      | ((
          request: { url?: string },
          response: {
            end(body?: string): void;
            setHeader(name: string, value: string): void;
            statusCode: number;
          },
          next: (error?: unknown) => void,
        ) => void)
      | undefined;
    plugin.configureServer!({
      watcher: { add() {} },
      ws: { send() {} },
      middlewares: { use: (handler) => (middleware = handler) },
    });

    const response = await new Promise<{ body: string; statusCode: number }>(
      (resolveResponse, rejectResponse) => {
        middleware!(
          { url: "/_heyo-docs/openapi/api/planets/list-planets.json" },
          {
            end: (body) =>
              resolveResponse({ body: body ?? "", statusCode: 200 }),
            setHeader() {},
            statusCode: 200,
          },
          rejectResponse,
        );
      },
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('"Planet"');
    expect(response.body).not.toContain('"Unused"');
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("loads YAML OpenAPI documents from the configured content directory", async () => {
  const root = await createFixture();
  await writeFile(
    join(root, "content", "openapi.yaml"),
    `openapi: 3.1.0
paths:
  /stars:
    get:
      operationId: listStars
      responses:
        "200":
          description: OK
`,
  );

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({
        content: "./content",
        groups: [{ group: "API", sections: [{ schema: "openapi.yaml" }] }],
      }),
    });
    plugin.configResolved({ command: "build", root });
    const id = plugin.resolveId("virtual:heyo-docs-openapi");
    const module = await plugin.load(id!);

    expect(module).toContain("listStars");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("includes OpenAPI endpoint Markdown in the server content module", async () => {
  const root = await createOpenApiFixture();

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({
        content: "./content",
        groups: [{ group: "API", sections: [{ schema: "./openapi.json" }] }],
      }),
    });
    plugin.configResolved({ command: "build", root });
    const id = plugin.resolveId("virtual:heyo-docs-content/server");
    const module = await plugin.load(id!);

    expect(module).toContain('"slug":"/api/planets/list-planets"');
    expect(module).toContain("# List Planets");
    expect(module).toContain("GET /planets");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("bundles local MDX images, themed images, videos, and file links from content and src", async () => {
  const root = await createAssetFixture();

  try {
    const plugin = heyoDocs({
      config: defineHeyoDocs({ content: "./content", groups: [] }),
    });
    plugin.configResolved({ command: "build", root });
    const id = plugin.resolveId("virtual:heyo-docs-mdx:index.mdx");
    const module = await plugin.load(id!);

    expect(module).toContain(
      JSON.stringify(`${join(root, "content", "assets", "diagram.svg")}?url`),
    );
    expect(module).toContain(
      JSON.stringify(
        `${join(root, "content", "assets", "diagram-dark.svg")}?url`,
      ),
    );
    expect(module).toContain(
      JSON.stringify(`${join(root, "content", "assets", "guide.pdf")}?url`),
    );
    expect(module).toContain(
      JSON.stringify(
        `${join(root, "content", "assets", "product-tour.mp4")}?url`,
      ),
    );
    expect(module).toContain(
      JSON.stringify(
        `${join(root, "content", "assets", "product-tour-poster.png")}?url`,
      ),
    );
    expect(module).toContain(
      JSON.stringify(`${join(root, "src", "brand.svg")}?url`),
    );
    expect(module).toContain(
      `import brand from ${JSON.stringify(join(root, "src", "brand.svg"))};`,
    );
    expect(module).toContain("src: __heyoDocsAsset0");
    expect(module).toContain("lightSrc: __heyoDocsAsset0");
    expect(module).toContain("darkSrc: __heyoDocsAsset2");
    expect(module).toContain("src: __heyoDocsAsset3");
    expect(module).toContain("href: __heyoDocsAsset3");
    expect(module).toContain("src: __heyoDocsAsset4");
    expect(module).toContain("poster: __heyoDocsAsset5");
    expect(module).toContain('src: "/images/public.svg"');
    expect(module).toContain('title: "app/routes/markdown.ts"');
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
