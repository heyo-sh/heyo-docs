import { expect, test } from "bun:test";

import { heyoDocs } from "../src/config";
import { navigationFromGroups } from "../src/navigation";
import {
  endpointsFromOpenApiDocuments,
  isOpenApiDocument,
  schemaExample,
} from "../src/openapi";
import { handleOpenApiRequest } from "../src/openapi/request";
import type { DocsPage, OpenApiDocumentSource } from "../src/types";

const document: OpenApiDocumentSource = {
  groupIndex: 0,
  sectionIndex: 1,
  schema: "./openapi.json",
  document: {
    openapi: "3.1.0",
    servers: [
      {
        url: "https://api.example.com/{version}",
        variables: { version: { default: "v1" } },
      },
    ],
    security: [{ BearerAuth: [] }],
    paths: {
      "/organizations/{organizationId}/planets/{planetId}": {
        parameters: [
          {
            name: "organizationId",
            in: "path",
            required: true,
            schema: { type: "string", example: "org_123" },
          },
        ],
        delete: {
          operationId: "deletePlanet",
          summary: "Delete a planet",
          description: "Deletes a [Planet](#/components/schemas/Planet).",
          tags: ["Planets"],
          parameters: [
            {
              name: "organizationId",
              in: "path",
              required: true,
              description: "Overrides the path-level description.",
              schema: { type: "string", example: "org_456" },
            },
            {
              name: "planetId",
              in: "path",
              required: true,
              schema: { type: "string", example: "planet_earth" },
            },
            {
              name: "accountId",
              in: "query",
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Planet response.",
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
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer" },
      },
      schemas: {
        Planet: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    },
  },
};

const customPage: DocsPage = {
  slug: "/api-overview",
  title: "API overview",
  description: "Custom API documentation.",
  content: () => null,
  seo: { title: "API overview", description: "Custom API documentation." },
  sourcePath: "api-overview.mdx",
  tableOfContents: [],
};

test("accepts OpenAPI 3 documents only", () => {
  expect(isOpenApiDocument({ openapi: "3.1.0", paths: {} })).toBe(true);
  expect(isOpenApiDocument({ swagger: "2.0", paths: {} })).toBe(false);
});

test("generates OpenAPI routes, form metadata, and sidebar badges after custom sections", () => {
  const config = heyoDocs({
    content: "./content",
    groups: [
      {
        group: "API Reference",
        sections: [
          { section: "Get started", pages: ["api-overview"] },
          { schema: "./openapi.json" },
        ],
      },
    ],
  });
  const endpoints = endpointsFromOpenApiDocuments(
    config.groups,
    [document],
    [customPage.slug],
  );
  const navigation = navigationFromGroups(
    config.groups,
    [customPage],
    endpoints,
  );
  const endpoint = endpoints.find(
    (candidate) => candidate.slug === "/api-reference/planets/delete-planet",
  );

  expect(endpoint?.method).toBe("delete");
  expect(endpoint?.description).toBe(
    "Deletes a [Planet](#/components/schemas/Planet).",
  );
  expect(endpoint?.servers).toEqual(["https://api.example.com/v1"]);
  expect(endpoint?.parameters).toEqual([
    expect.objectContaining({
      name: "organizationId",
      description: "Overrides the path-level description.",
      example: "org_456",
    }),
    expect.objectContaining({ name: "planetId", example: "planet_earth" }),
    expect.objectContaining({ name: "accountId", example: "" }),
  ]);
  expect(endpoint?.responses[0]?.example).toEqual({ id: "", name: "string" });
  expect(navigation[0]?.sections.map((section) => section.section)).toEqual([
    "Get started",
    "Planets",
  ]);
  expect(navigation[0]?.sections[1]?.pages).toEqual([
    {
      slug: "/api-reference/planets/delete-planet",
      title: "Delete a planet",
      method: "delete",
    },
  ]);
});

test("lets an MDX route take priority over a generated OpenAPI endpoint", () => {
  const config = heyoDocs({
    content: "./content",
    groups: [
      { group: "API Reference", sections: [{ schema: "./openapi.json" }] },
    ],
  });
  const reservedEndpointPage = {
    ...customPage,
    slug: "/api-reference/planets/delete-planet",
    sourcePath: "api/delete-planet.mdx",
  };
  const endpoints = endpointsFromOpenApiDocuments(
    config.groups,
    [{ ...document, sectionIndex: 0 }],
    [reservedEndpointPage.slug],
  );
  const navigation = navigationFromGroups(
    config.groups,
    [reservedEndpointPage],
    endpoints,
  );

  expect(endpoints).toEqual([]);
  expect(navigation[0]?.sections.flatMap((section) => section.pages)).toEqual(
    [],
  );
});

test("builds examples for composed OpenAPI schemas", () => {
  expect(
    schemaExample(
      { paths: {} },
      {
        allOf: [
          { type: "object", properties: { id: { type: "string" } } },
          { type: "object", properties: { name: { example: "Mars" } } },
        ],
      },
    ),
  ).toEqual({ id: "", name: "Mars" });
  expect(
    schemaExample(
      { paths: {} },
      { oneOf: [{ type: "string", enum: ["first"] }, { type: "string" }] },
    ),
  ).toBe("first");
});

test("forwards Try It requests only to declared OpenAPI servers", async () => {
  const originalFetch = globalThis.fetch;
  let forwardedUrl = "";
  let forwardedInit: RequestInit | undefined;
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async (input: URL | RequestInfo, init?: RequestInit) => {
      forwardedUrl = String(input);
      forwardedInit = init;
      return new Response('{"id":"planet_mars"}', {
        headers: { "content-type": "application/json" },
        status: 201,
      });
    },
    writable: true,
  });

  try {
    const response = await handleOpenApiRequest(
      new Request(
        "https://docs.example.com/heyo-docs-internal/openapi-request",
        {
          body: JSON.stringify({
            bearerToken: "token",
            body: '{"name":"Mars"}',
            endpointSlug: "create-planet",
            parameters: {
              "header:x-account-id": "account_123",
              "path:planetId": "planet_mars",
              "query:include": "moons",
            },
            server: "https://api.example.com",
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
      ),
      [
        {
          method: "post",
          parameters: [
            { in: "path", name: "planetId" },
            { in: "query", name: "include" },
            { in: "header", name: "x-account-id" },
          ],
          path: "/planets/{planetId}",
          requestBody: { contentType: "application/json" },
          servers: ["https://api.example.com"],
          slug: "create-planet",
        },
      ],
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "planet_mars" });
    expect(forwardedUrl).toBe(
      "https://api.example.com/planets/planet_mars?include=moons",
    );
    expect(forwardedInit).toMatchObject({
      body: '{"name":"Mars"}',
      method: "POST",
    });
    const headers = new Headers(forwardedInit?.headers);
    expect(headers.get("authorization")).toBe("Bearer token");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-account-id")).toBe("account_123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("forwards only declared parameters to a same-origin endpoint without servers", async () => {
  const originalFetch = globalThis.fetch;
  let forwardedUrl = "";
  let forwardedHeaders = new Headers();
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async (input: URL | RequestInfo, init?: RequestInit) => {
      forwardedUrl = String(input);
      forwardedHeaders = new Headers(init?.headers);
      return new Response(null, { status: 204 });
    },
    writable: true,
  });

  try {
    const response = await handleOpenApiRequest(
      new Request(
        "https://docs.example.com/heyo-docs-internal/openapi-request",
        {
          body: JSON.stringify({
            endpointSlug: "get-planet",
            parameters: {
              "path:planetId": "earth/moon",
              "query:include": "rings & moons",
              "header:x-request-id": "request_123",
              "header:authorization": "untrusted",
              unexpected: "ignored",
            },
            server: "",
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
      ),
      [
        {
          method: "get",
          parameters: [
            { in: "path", name: "planetId" },
            { in: "query", name: "include" },
            { in: "header", name: "x-request-id" },
          ],
          path: "/planets/{planetId}",
          servers: [],
          slug: "get-planet",
        },
      ],
    );

    expect(response.status).toBe(204);
    expect(forwardedUrl).toBe(
      "https://docs.example.com/planets/earth%2Fmoon?include=rings+%26+moons",
    );
    expect(forwardedHeaders.get("x-request-id")).toBe("request_123");
    expect(forwardedHeaders.get("authorization")).toBeNull();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("forwards malformed endpoint paths without backtracking", async () => {
  const originalFetch = globalThis.fetch;
  const path = `{{${"{{|".repeat(10_000)}`;
  let forwardedUrl = "";
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async (input: URL | RequestInfo) => {
      forwardedUrl = String(input);
      return new Response(null, { status: 204 });
    },
    writable: true,
  });

  try {
    const response = await handleOpenApiRequest(
      new Request(
        "https://docs.example.com/heyo-docs-internal/openapi-request",
        {
          body: JSON.stringify({
            endpointSlug: "malformed-path",
            parameters: {},
            server: "https://api.example.com",
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
      ),
      [
        {
          method: "get",
          parameters: [],
          path,
          servers: ["https://api.example.com"],
          slug: "malformed-path",
        },
      ],
    );

    expect(response.status).toBe(204);
    expect(forwardedUrl).toBe(`https://api.example.com${path}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects malformed Try It requests before forwarding them", async () => {
  const endpoints = [
    {
      method: "get",
      parameters: [],
      path: "/planets",
      servers: ["https://api.example.com"],
      slug: "list-planets",
    },
  ];

  const malformed = await handleOpenApiRequest(
    new Request("https://docs.example.com/heyo-docs-internal/openapi-request", {
      body: JSON.stringify({ endpointSlug: "list-planets", server: 123 }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }),
    endpoints,
  );
  const missing = await handleOpenApiRequest(
    new Request("https://docs.example.com/heyo-docs-internal/openapi-request", {
      body: JSON.stringify({
        endpointSlug: "missing",
        server: "https://api.example.com",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }),
    endpoints,
  );

  expect(malformed.status).toBe(400);
  await expect(malformed.text()).resolves.toBe("Invalid OpenAPI request.");
  expect(missing.status).toBe(404);
  await expect(missing.text()).resolves.toBe("Endpoint not found.");
});

test("rejects Try It requests to undeclared OpenAPI servers", async () => {
  const response = await handleOpenApiRequest(
    new Request("https://docs.example.com/heyo-docs-internal/openapi-request", {
      body: JSON.stringify({
        endpointSlug: "create-planet",
        parameters: {},
        server: "https://untrusted.example.com",
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    }),
    [
      {
        method: "post",
        parameters: [],
        path: "/planets",
        servers: ["https://api.example.com"],
        slug: "create-planet",
      },
    ],
  );

  expect(response.status).toBe(400);
  await expect(response.text()).resolves.toBe(
    "API server is not declared in the OpenAPI schema.",
  );
});
