import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "bun:test";

import { heyoDocs } from "../src/config";
import { documentationPaths, loadOpenApiDocuments } from "../src/server";

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), "heyo-docs-server-"));
  await mkdir(join(root, "content", "guides"), { recursive: true });
  await mkdir(join(root, "public"), { recursive: true });
  await writeFile(join(root, "content", "index.mdx"), "# Home\n");
  await writeFile(
    join(root, "content", "guides", "install.mdx"),
    "# Install\n",
  );
  await writeFile(
    join(root, "public", "openapi.yaml"),
    `openapi: 3.1.0
paths:
  /widgets:
    get:
      operationId: listWidgets
      tags: [Widgets]
      responses:
        "200":
          description: OK
`,
  );
  return root;
}

test("loads public YAML schemas and returns every MDX and generated OpenAPI route", async () => {
  const root = await createFixture();
  const config = heyoDocs({
    content: "content",
    groups: [
      {
        group: "Documentation",
        sections: [{ pages: ["index", "guides"] }],
      },
      { group: "API", sections: [{ schema: "/openapi.yaml" }] },
    ],
  });

  try {
    await expect(loadOpenApiDocuments(root, config)).resolves.toEqual([
      expect.objectContaining({
        groupIndex: 1,
        sectionIndex: 0,
        schema: "/openapi.yaml",
        document: expect.objectContaining({ openapi: "3.1.0" }),
      }),
    ]);
    await expect(documentationPaths(root, config)).resolves.toEqual([
      "/",
      "/api/widgets/list-widgets",
      "/guides/install",
    ]);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("rejects missing, malformed, and structurally invalid server OpenAPI schemas", async () => {
  const root = await createFixture();

  try {
    await expect(
      loadOpenApiDocuments(
        root,
        heyoDocs({
          content: "content",
          groups: [{ group: "API", sections: [{ schema: "missing.json" }] }],
        }),
      ),
    ).rejects.toThrow('could not load OpenAPI schema "missing.json"');

    await writeFile(join(root, "content", "broken.json"), "{");
    await expect(
      loadOpenApiDocuments(
        root,
        heyoDocs({
          content: "content",
          groups: [{ group: "API", sections: [{ schema: "broken.json" }] }],
        }),
      ),
    ).rejects.toThrow('could not parse OpenAPI schema "broken.json"');

    await writeFile(
      join(root, "content", "not-openapi.json"),
      JSON.stringify({ openapi: "3.1.0", info: { title: "Missing paths" } }),
    );
    await expect(
      loadOpenApiDocuments(
        root,
        heyoDocs({
          content: "content",
          groups: [
            { group: "API", sections: [{ schema: "not-openapi.json" }] },
          ],
        }),
      ),
    ).rejects.toThrow(
      'must be an OpenAPI 3 document with a top-level "paths" object',
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("loads an HTTP OpenAPI schema at build time and reports unsuccessful responses", async () => {
  const root = await createFixture();
  const originalFetch = globalThis.fetch;
  let requestedSchema = "";
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async (input: URL | RequestInfo) => {
      requestedSchema = String(input);
      return new Response(
        JSON.stringify({ openapi: "3.1.0", paths: { "/health": {} } }),
      );
    },
    writable: true,
  });

  try {
    await expect(
      loadOpenApiDocuments(
        root,
        heyoDocs({
          content: "content",
          groups: [
            {
              group: "API",
              sections: [
                { schema: "https://schemas.example.com/openapi.json" },
              ],
            },
          ],
        }),
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        schema: "https://schemas.example.com/openapi.json",
      }),
    ]);
    expect(requestedSchema).toBe("https://schemas.example.com/openapi.json");

    globalThis.fetch = (async () =>
      new Response("Unavailable", { status: 503 })) as unknown as typeof fetch;
    await expect(
      loadOpenApiDocuments(
        root,
        heyoDocs({
          content: "content",
          groups: [
            {
              group: "API",
              sections: [
                { schema: "https://schemas.example.com/openapi.json" },
              ],
            },
          ],
        }),
      ),
    ).rejects.toThrow("503");
  } finally {
    globalThis.fetch = originalFetch;
    await rm(root, { force: true, recursive: true });
  }
});
