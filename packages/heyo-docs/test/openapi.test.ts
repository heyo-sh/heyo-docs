import { expect, test } from "bun:test";

import { heyoDocs } from "../src/config";
import { navigationFromGroups } from "../src/navigation";
import { endpointsFromOpenApiDocuments, schemaExample } from "../src/openapi";
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

test("normalises Swagger 2 request bodies, responses, servers, and security", () => {
  const config = heyoDocs({
    content: "./content",
    groups: [{ group: "Legacy API", sections: [{ schema: "./swagger.json" }] }],
  });
  const endpoints = endpointsFromOpenApiDocuments(config.groups, [
    {
      groupIndex: 0,
      sectionIndex: 0,
      schema: "./swagger.json",
      document: {
        swagger: "2.0",
        host: "api.example.com",
        basePath: "/v1",
        schemes: ["https"],
        consumes: ["application/json"],
        produces: ["application/json"],
        security: [{ BearerAuth: [] }],
        securityDefinitions: {
          BearerAuth: { type: "http", scheme: "bearer" },
        },
        paths: {
          "/planets/{planetId}": {
            parameters: [
              {
                name: "planetId",
                in: "path",
                required: true,
                type: "string",
              },
            ],
            post: {
              operationId: "createPlanet",
              parameters: [
                {
                  name: "body",
                  in: "body",
                  required: true,
                  description: "The planet to create.",
                  schema: { $ref: "#/definitions/Planet" },
                },
              ],
              responses: {
                "201": {
                  description: "Created",
                  schema: { $ref: "#/definitions/Planet" },
                  examples: {
                    "application/json": { id: "planet_mars", name: "Mars" },
                  },
                },
              },
            },
          },
        },
        definitions: {
          Planet: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string", example: "Mars" },
            },
          },
        },
      },
    },
  ]);
  const endpoint = endpoints[0];

  expect(endpoint).toMatchObject({
    method: "post",
    path: "/planets/{planetId}",
    servers: ["https://api.example.com/v1"],
    parameters: [
      {
        name: "planetId",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    ],
    requestBody: {
      contentType: "application/json",
      description: "The planet to create.",
      required: true,
      example: { id: "", name: "Mars" },
    },
    responses: [
      {
        status: "201",
        contentType: "application/json",
        example: { id: "planet_mars", name: "Mars" },
      },
    ],
    securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  });
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
