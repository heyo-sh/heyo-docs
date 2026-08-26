import type {
  DocsGroupConfig,
  DocumentationGroupConfig,
  OpenApiDocument,
  OpenApiDocumentSource,
  OpenApiEndpoint,
  OpenApiHttpMethod,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSchema,
} from "./types";

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const satisfies readonly OpenApiHttpMethod[];

type UnknownRecord = Record<string, unknown>;

/** Public, cacheable location for one build-generated OpenAPI endpoint payload. */
const OPENAPI_ENDPOINT_DATA_DIRECTORY = "/_heyo-docs/openapi";

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        const string = asString(item);
        return string ? [string] : [];
      })
    : [];
}

function preferredContentType(contentTypes: string[]): string | undefined {
  return (
    contentTypes.find((contentType) =>
      contentType.toLowerCase().includes("json"),
    ) ?? contentTypes[0]
  );
}

function contentTypesFor(
  document: OpenApiDocument,
  operation: UnknownRecord,
  pathItem: UnknownRecord,
  field: "consumes" | "produces",
): string[] {
  const value = Array.isArray(operation[field])
    ? operation[field]
    : Array.isArray(pathItem[field])
      ? pathItem[field]
      : document[field];
  return asStringArray(value);
}

function isSwagger2Document(document: OpenApiDocument): boolean {
  return asString(document.swagger)?.startsWith("2.") ?? false;
}

/** Normalises Square's `entity:` links into standard local OpenAPI refs. */
export function openApiDescription(
  document: OpenApiDocument,
  value: unknown,
): string | undefined {
  const description = asString(value);
  if (!description) return description;

  const schemas = asRecord(asRecord(document.components).schemas);
  return description.replace(
    /\]\(entity:([^\s)]+)\)/g,
    (match, rawName: string) => {
      const name = decodeSchemaName(rawName);
      return name && name in schemas
        ? `](#/components/schemas/${name})`
        : match;
    },
  );
}

function decodeSchemaName(value: string): string | undefined {
  try {
    const decoded = decodeURIComponent(value)
      .replaceAll("~1", "/")
      .replaceAll("~0", "~");
    return decoded || undefined;
  } catch {
    return undefined;
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleFromIdentifier(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_/]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function valueAtPointer(document: OpenApiDocument, pointer: string): unknown {
  if (!pointer.startsWith("#/")) return undefined;
  return pointer
    .slice(2)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((value, segment) => asRecord(value)[segment], document);
}

/** Resolves local `#/…` refs while preserving unresolved and cyclic references. */
export function resolveOpenApiRef<T>(
  document: OpenApiDocument,
  value: T,
  seen = new Set<string>(),
): T {
  if (!isRecord(value)) return value;
  const ref = asString(value.$ref);
  if (!ref?.startsWith("#/") || seen.has(ref)) return value;
  const target = valueAtPointer(document, ref);
  if (!isRecord(target)) return value;
  const nextSeen = new Set(seen);
  nextSeen.add(ref);
  return {
    ...resolveOpenApiRef(document, target, nextSeen),
    ...Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== "$ref"),
    ),
  } as T;
}

function exampleFromContent(
  document: OpenApiDocument,
  content: UnknownRecord,
): { contentType?: string; example?: unknown; schema?: OpenApiSchema } {
  const entries = Object.entries(content);
  const contentType = preferredContentType(entries.map(([type]) => type));
  const rawMedia = contentType ? content[contentType] : undefined;
  if (!contentType || !isRecord(rawMedia)) return {};
  const media = resolveOpenApiRef(document, rawMedia);
  const examples = asRecord(media.examples);
  const firstExample = Object.values(examples)[0];
  const resolvedExample = isRecord(firstExample)
    ? resolveOpenApiRef(document, firstExample)
    : firstExample;
  return {
    contentType,
    example: media.example ?? asRecord(resolvedExample).value,
    schema: schemaFromRaw(document, media.schema),
  };
}

function swaggerExample(
  source: UnknownRecord,
  contentTypes: string[],
): { contentType?: string; example?: unknown } {
  const examples = asRecord(source.examples);
  const contentType =
    preferredContentType(
      contentTypes.filter((candidate) => candidate in examples),
    ) ??
    preferredContentType(contentTypes) ??
    preferredContentType(Object.keys(examples));
  return {
    contentType,
    example: contentType ? examples[contentType] : undefined,
  };
}

function schemaFromRaw(
  document: OpenApiDocument,
  raw: unknown,
): OpenApiSchema | undefined {
  if (!isRecord(raw)) return undefined;
  const resolved = resolveOpenApiRef(document, raw) as OpenApiSchema;
  const ref = asString(raw.$ref);
  return ref ? { ...resolved, $ref: ref } : resolved;
}

function parameterSchemaFromRaw(
  document: OpenApiDocument,
  parameter: UnknownRecord,
): OpenApiSchema | undefined {
  const schema = schemaFromRaw(document, parameter.schema);
  if (schema) return schema;

  const type = asString(parameter.type);
  const format = asString(parameter.format);
  const items = schemaFromRaw(document, parameter.items);
  const enumValues = Array.isArray(parameter.enum) ? parameter.enum : undefined;
  if (
    !type &&
    !format &&
    !items &&
    !enumValues &&
    parameter.default === undefined
  )
    return undefined;

  return {
    ...(type ? { type } : {}),
    ...(format ? { format } : {}),
    ...(items ? { items } : {}),
    ...(enumValues ? { enum: enumValues } : {}),
    ...(parameter.default !== undefined ? { default: parameter.default } : {}),
  };
}

function parameterFromRaw(
  document: OpenApiDocument,
  raw: unknown,
): OpenApiParameter | undefined {
  const parameter = resolveOpenApiRef(document, asRecord(raw));
  const name = asString(parameter.name);
  const location = asString(parameter.in);
  if (!name || !location) return undefined;
  const contentExample = exampleFromContent(
    document,
    asRecord(parameter.content),
  );
  const schema = parameterSchemaFromRaw(document, parameter);
  return {
    name,
    in: location,
    description: openApiDescription(document, parameter.description),
    required: parameter.required === true || location === "path",
    deprecated: parameter.deprecated === true,
    example:
      parameter.example ??
      contentExample.example ??
      (schema ? schemaExample(document, schema, new Set(), name) : undefined),
    schema: schema ?? contentExample.schema,
  };
}

function requestBodyFromRaw(
  document: OpenApiDocument,
  raw: unknown,
): OpenApiRequestBody | undefined {
  const body = resolveOpenApiRef(document, asRecord(raw));
  const { contentType, example, schema } = exampleFromContent(
    document,
    asRecord(body.content),
  );
  if (!contentType) return undefined;
  return {
    contentType,
    description: openApiDescription(document, body.description),
    required: body.required === true,
    example: example ?? (schema ? schemaExample(document, schema) : undefined),
    schema,
  };
}

function swaggerRequestBodyFromParameters(
  document: OpenApiDocument,
  parameters: unknown[],
  consumes: string[],
): OpenApiRequestBody | undefined {
  const raw = [...parameters]
    .reverse()
    .map((parameter) => resolveOpenApiRef(document, asRecord(parameter)))
    .find((parameter) => parameter.in === "body");
  if (!raw) return undefined;

  const schema = schemaFromRaw(document, raw.schema);
  if (!schema) return undefined;
  return {
    contentType: preferredContentType(consumes) ?? "application/json",
    description: openApiDescription(document, raw.description),
    required: raw.required === true,
    example: schemaExample(document, schema),
    schema,
  };
}

function responsesFromRaw(
  document: OpenApiDocument,
  raw: unknown,
  produces: string[] = [],
): OpenApiResponse[] {
  return Object.entries(asRecord(raw)).map(([status, rawResponse]) => {
    const response = resolveOpenApiRef(document, asRecord(rawResponse));
    const content = exampleFromContent(document, asRecord(response.content));
    const swagger = swaggerExample(response, produces);
    const schema = content.schema ?? schemaFromRaw(document, response.schema);
    return {
      status,
      description: openApiDescription(document, response.description),
      contentType: content.contentType ?? swagger.contentType,
      example:
        content.example ??
        swagger.example ??
        (schema ? schemaExample(document, schema) : undefined),
      schema,
    };
  });
}

function firstPathSegment(path: string): string {
  return (
    path
      .split("/")
      .filter((segment) => segment && !segment.startsWith("{"))[0] ??
    "endpoints"
  );
}

function serversFor(
  operation: UnknownRecord,
  pathItem: UnknownRecord,
  document: OpenApiDocument,
): string[] {
  if (isSwagger2Document(document)) {
    const host = asString(document.host);
    if (!host) return [];
    const basePath = asString(document.basePath);
    const path = basePath ? `/${basePath.replace(/^\/+|\/+$/g, "")}` : "";
    const schemes = asStringArray(document.schemes).filter((scheme) =>
      /^https?$/i.test(scheme),
    );
    return (schemes.length ? schemes : ["https"]).map(
      (scheme) => `${scheme.toLowerCase()}://${host}${path}`,
    );
  }
  const rawServers = Array.isArray(operation.servers)
    ? operation.servers
    : Array.isArray(pathItem.servers)
      ? pathItem.servers
      : Array.isArray(document.servers)
        ? document.servers
        : [];
  return rawServers
    .map((rawServer) => {
      const server = asRecord(rawServer);
      const url = asString(server.url);
      if (!url) return undefined;
      const variables = asRecord(server.variables);
      return url.replace(/\{([^}]+)\}/g, (match, name: string) => {
        const variable = asRecord(variables[name]);
        return (
          asString(variable.default) ??
          asString(
            Array.isArray(variable.enum) ? variable.enum[0] : undefined,
          ) ??
          match
        );
      });
    })
    .filter((server): server is string => !!server);
}

function endpointSlug(
  group: DocumentationGroupConfig,
  path: string,
  method: OpenApiHttpMethod,
  operation: UnknownRecord,
): string {
  const tag = asStringArray(operation.tags)[0] ?? firstPathSegment(path);
  const operationName =
    asString(operation.operationId) ?? `${method}-${path.replace(/[{}]/g, "")}`;
  return `/${[group.group, tag, operationName]
    .map(slugify)
    .filter(Boolean)
    .join("/")}`;
}

/** Builds serialisable endpoint data from a group and one parsed OpenAPI document. */
export function endpointsFromOpenApiDocument(
  group: DocumentationGroupConfig,
  groupIndex: number,
  document: OpenApiDocument,
  sectionIndex: number,
): OpenApiEndpoint[] {
  const endpoints: OpenApiEndpoint[] = [];
  const paths = asRecord(document.paths);

  for (const [path, rawPathItem] of Object.entries(paths)) {
    const pathItem = resolveOpenApiRef(document, asRecord(rawPathItem));
    const inheritedParameters = Array.isArray(pathItem.parameters)
      ? pathItem.parameters
      : [];

    for (const method of HTTP_METHODS) {
      const rawOperation = pathItem[method];
      if (!isRecord(rawOperation)) continue;
      const operation = resolveOpenApiRef(document, rawOperation);
      const operationParameters = Array.isArray(operation.parameters)
        ? operation.parameters
        : [];
      const parameters = [...inheritedParameters, ...operationParameters]
        .map((parameter) => parameterFromRaw(document, parameter))
        .filter(
          (parameter): parameter is OpenApiParameter =>
            !!parameter && parameter.in !== "body",
        );
      const uniqueParameters = parameters.filter(
        (parameter, index) =>
          !parameters
            .slice(index + 1)
            .some(
              (candidate) =>
                candidate.name === parameter.name &&
                candidate.in === parameter.in,
            ),
      );
      const title =
        asString(operation.summary) ??
        (asString(operation.operationId)
          ? titleFromIdentifier(asString(operation.operationId)!)
          : `${method.toUpperCase()} ${path}`);

      endpoints.push({
        groupIndex,
        sectionIndex,
        slug: endpointSlug(group, path, method, operation),
        method,
        path,
        title,
        description: openApiDescription(document, operation.description),
        summary: asString(operation.summary),
        operationId: asString(operation.operationId),
        tags: asStringArray(operation.tags),
        parameters: uniqueParameters,
        requestBody:
          requestBodyFromRaw(document, operation.requestBody) ??
          (isSwagger2Document(document)
            ? swaggerRequestBodyFromParameters(
                document,
                [...inheritedParameters, ...operationParameters],
                contentTypesFor(document, operation, pathItem, "consumes"),
              )
            : undefined),
        responses: responsesFromRaw(
          document,
          operation.responses,
          isSwagger2Document(document)
            ? contentTypesFor(document, operation, pathItem, "produces")
            : [],
        ),
        security: Array.isArray(operation.security)
          ? operation.security
          : Array.isArray(document.security)
            ? document.security
            : [],
        servers: serversFor(operation, pathItem, document),
        securitySchemes: isSwagger2Document(document)
          ? asRecord(document.securityDefinitions)
          : asRecord(asRecord(document.components).securitySchemes),
        document,
      });
    }
  }

  return endpoints;
}

/**
 * Creates endpoints for configured OpenAPI groups. MDX routes reserve their
 * paths, so custom pages always win over generated API pages.
 */
export function endpointsFromOpenApiDocuments(
  groups: DocsGroupConfig[],
  sources: OpenApiDocumentSource[],
  reservedSlugs: Iterable<string> = [],
): OpenApiEndpoint[] {
  const reserved = new Set(reservedSlugs);
  const used = new Set(reserved);
  const endpoints: OpenApiEndpoint[] = [];

  groups.forEach((group, groupIndex) => {
    if (group.type === "changelog") return;
    group.sections.forEach((section, sectionIndex) => {
      if (!("schema" in section)) return;
      const source = sources.find(
        (candidate) =>
          candidate.groupIndex === groupIndex &&
          candidate.sectionIndex === sectionIndex,
      );
      if (!source) return;
      for (const endpoint of endpointsFromOpenApiDocument(
        group,
        groupIndex,
        source.document,
        sectionIndex,
      )) {
        if (reserved.has(endpoint.slug)) continue;
        const baseSlug = endpoint.slug;
        let suffix = 2;
        while (used.has(endpoint.slug)) {
          endpoint.slug = `${baseSlug}-${suffix++}`;
        }
        used.add(endpoint.slug);
        endpoints.push(endpoint);
      }
    });
  });

  return endpoints;
}

/**
 * Produces the compact endpoint data needed for client navigation and search.
 * The full OpenAPI document is intentionally excluded and is supplied only for
 * the endpoint currently rendered by a server framework.
 */
export function openApiEndpointIndex(
  endpoints: OpenApiEndpoint[],
): OpenApiEndpoint[] {
  return endpoints.map((endpoint) => ({
    groupIndex: endpoint.groupIndex,
    sectionIndex: endpoint.sectionIndex,
    slug: endpoint.slug,
    method: endpoint.method,
    path: endpoint.path,
    title: endpoint.title,
    operationId: endpoint.operationId,
    tags: endpoint.tags,
    parameters: endpoint.parameters.map((parameter) => ({
      name: parameter.name,
      in: parameter.in,
      required: parameter.required,
      deprecated: parameter.deprecated,
    })),
    responses: [],
    security: [],
    servers: [],
    securitySchemes: {},
  }));
}

/**
 * Returns the stable static JSON URL for a generated OpenAPI endpoint. These
 * files are emitted at build time, so opening an API reference page never
 * requires a server function merely to read the OpenAPI document.
 */
export function openApiEndpointDataPath(slug: string): string {
  const segments = slug
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  return `${OPENAPI_ENDPOINT_DATA_DIRECTORY}/${segments.join("/")}.json`;
}

/** File name, relative to a framework's public build output. */
export function openApiEndpointDataFileName(slug: string): string {
  return openApiEndpointDataPath(slug).replace(/^\//, "");
}

/**
 * Creates the detailed, static payload for one endpoint. It retains the
 * endpoint fields plus only the schemas reachable from that endpoint, rather
 * than embedding the complete OpenAPI document in every generated JSON file.
 */
export function openApiEndpointDetail(
  endpoint: OpenApiEndpoint,
): OpenApiEndpoint {
  if (!endpoint.document) return endpoint;

  return {
    ...endpoint,
    document: documentForEndpoint(endpoint.document, endpoint),
  };
}

function documentForEndpoint(
  document: OpenApiDocument,
  endpoint: OpenApiEndpoint,
): OpenApiDocument {
  const componentSchemas = asRecord(asRecord(document.components).schemas);
  const definitions = asRecord(document.definitions);
  const componentNames = new Set<string>();
  const definitionNames = new Set<string>();
  const { document: _document, ...endpointData } = endpoint;

  collectSchemaReferences(endpointData, componentNames, definitionNames);
  const pathItem = asRecord(asRecord(document.paths)[endpoint.path]);
  // `OpenApiEndpoint` is deliberately a compact presentation model. Scan the
  // source operation as well, because its normalised response metadata does
  // not retain raw `$ref` values used by request and response schemas.
  collectSchemaReferences(pathItem.parameters, componentNames, definitionNames);
  collectSchemaReferences(
    pathItem[endpoint.method],
    componentNames,
    definitionNames,
  );
  for (;;) {
    const referenceCount = componentNames.size + definitionNames.size;
    collectReachableSchemas(
      componentSchemas,
      componentNames,
      componentNames,
      definitionNames,
    );
    collectReachableSchemas(
      definitions,
      definitionNames,
      componentNames,
      definitionNames,
    );
    if (componentNames.size + definitionNames.size === referenceCount) break;
  }

  const compactDocument: OpenApiDocument = { paths: {} };
  const openapi = asString(document.openapi);
  const swagger = asString(document.swagger);
  if (openapi) compactDocument.openapi = openapi;
  if (swagger) compactDocument.swagger = swagger;

  const retainedComponents = Object.fromEntries(
    [...componentNames].flatMap((name) =>
      componentSchemas[name] === undefined
        ? []
        : ([[name, componentSchemas[name]]] as const),
    ),
  );
  if (Object.keys(retainedComponents).length)
    compactDocument.components = { schemas: retainedComponents };

  const retainedDefinitions = Object.fromEntries(
    [...definitionNames].flatMap((name) =>
      definitions[name] === undefined
        ? []
        : ([[name, definitions[name]]] as const),
    ),
  );
  if (Object.keys(retainedDefinitions).length)
    compactDocument.definitions = retainedDefinitions;

  return compactDocument;
}

function collectReachableSchemas(
  source: UnknownRecord,
  pending: Set<string>,
  componentNames: Set<string>,
  definitionNames: Set<string>,
) {
  const inspected = new Set<string>();
  for (;;) {
    const name = [...pending].find((candidate) => !inspected.has(candidate));
    if (!name) return;
    inspected.add(name);
    const schema = source[name];
    if (schema !== undefined)
      collectSchemaReferences(schema, componentNames, definitionNames);
  }
}

function collectSchemaReferences(
  value: unknown,
  componentNames: Set<string>,
  definitionNames: Set<string>,
) {
  if (Array.isArray(value)) {
    value.forEach((item) =>
      collectSchemaReferences(item, componentNames, definitionNames),
    );
    return;
  }
  if (!isRecord(value)) return;

  const ref = asString(value.$ref);
  if (ref) addSchemaReference(ref, componentNames, definitionNames);
  for (const nested of Object.values(value))
    collectSchemaReferences(nested, componentNames, definitionNames);
}

function addSchemaReference(
  ref: string,
  componentNames: Set<string>,
  definitionNames: Set<string>,
) {
  const component = ref.match(/^#\/components\/schemas\/(.+)$/)?.[1];
  if (component) {
    const name = decodeSchemaName(component);
    if (name) componentNames.add(name);
    return;
  }
  const definition = ref.match(/^#\/definitions\/(.+)$/)?.[1];
  if (definition) {
    const name = decodeSchemaName(definition);
    if (name) definitionNames.add(name);
  }
}

/** Creates a useful request/response example for a schema without evaluating it. */
export function schemaExample(
  document: OpenApiDocument,
  rawSchema: unknown,
  seen = new Set<string>(),
  propertyName?: string,
): unknown {
  const source = asRecord(rawSchema);
  const ref = asString(source.$ref);
  if (ref?.startsWith("#/") && !seen.has(ref)) {
    const nextSeen = new Set(seen);
    nextSeen.add(ref);
    return schemaExample(
      document,
      valueAtPointer(document, ref),
      nextSeen,
      propertyName,
    );
  }
  if (source.example !== undefined) return source.example;
  if (source.default !== undefined) return source.default;
  if (source.const !== undefined) return source.const;
  if (Array.isArray(source.enum) && source.enum.length) return source.enum[0];

  const allOf = Array.isArray(source.allOf) ? source.allOf : [];
  if (allOf.length) {
    const examples = allOf.map((schema) =>
      schemaExample(document, schema, seen, propertyName),
    );
    if (examples.every(isRecord)) return Object.assign({}, ...examples);
    return examples.find((example) => example !== undefined);
  }
  const alternatives = Array.isArray(source.oneOf)
    ? source.oneOf
    : Array.isArray(source.anyOf)
      ? source.anyOf
      : [];
  if (alternatives.length)
    return schemaExample(document, alternatives[0], seen, propertyName);

  const type = asString(source.type);
  const properties = asRecord(source.properties);
  if (type === "object" || Object.keys(properties).length) {
    return Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [
        key,
        schemaExample(document, value, seen, key),
      ]),
    );
  }
  if (type === "array")
    return [schemaExample(document, source.items ?? {}, seen, propertyName)];
  if (type === "boolean") return true;
  if (type === "integer") return 1;
  if (type === "number") return 1.5;
  if (type === "string" || !type) {
    if (isIdentifier(propertyName)) return "";
    const format = asString(source.format);
    if (format === "date-time") return "2026-01-01T00:00:00Z";
    if (format === "date") return "2026-01-01";
    if (format === "email") return "user@example.com";
    if (format === "uuid") return "123e4567-e89b-12d3-a456-426614174000";
    if (format === "uri" || format === "url") return "https://example.com";
    return "string";
  }
  return undefined;
}

function isIdentifier(propertyName: string | undefined) {
  return !!propertyName && /(?:^id$|[_-]id$|Id$)/.test(propertyName);
}

export function isOpenApiDocument(value: unknown): value is OpenApiDocument {
  return isRecord(value) && isRecord(value.paths);
}
