/**
 * Minimal endpoint shape required by the request proxy. Keeping this module
 * free of imports makes it safe for Worker route handlers.
 */
interface OpenApiRequestEndpoint {
  slug: string;
  servers: string[];
  path: string;
  method: string;
  parameters: Array<{ in: string; name: string }>;
  requestBody?: { contentType: string };
}

interface OpenApiRequestPayload {
  bearerToken: string;
  body?: string;
  endpointSlug: string;
  parameters: Record<string, string>;
  server: string;
}

/**
 * Validates and forwards a Try It request. The caller supplies the build-time
 * endpoint list; arbitrary hosts are never accepted from the browser payload.
 */
export async function handleOpenApiRequest(
  request: Request,
  endpoints: OpenApiRequestEndpoint[],
): Promise<Response> {
  const payload = await requestPayload(request);
  if (!payload)
    return new Response("Invalid OpenAPI request.", { status: 400 });

  const endpoint = endpoints.find(
    (candidate) => candidate.slug === payload.endpointSlug,
  );
  if (!endpoint) return new Response("Endpoint not found.", { status: 404 });
  if (endpoint.servers.length && !endpoint.servers.includes(payload.server))
    return new Response("API server is not declared in the OpenAPI schema.", {
      status: 400,
    });
  if (!endpoint.servers.length && payload.server)
    return new Response("This endpoint does not declare an API server.", {
      status: 400,
    });

  try {
    const response = await fetch(
      requestUrl(endpoint, payload.server, payload.parameters, request.url),
      {
        method: endpoint.method.toUpperCase(),
        headers: requestHeaders(
          endpoint,
          payload.parameters,
          payload.bearerToken,
        ),
        body: payload.body,
      },
    );
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    return new Response(
      [204, 205, 304].includes(response.status)
        ? null
        : await response.arrayBuffer(),
      {
        headers,
        status: response.status,
        statusText: response.statusText,
      },
    );
  } catch {
    return new Response("The API server could not be reached.", {
      status: 502,
    });
  }
}

async function requestPayload(
  request: Request,
): Promise<OpenApiRequestPayload | undefined> {
  try {
    const value: unknown = await request.json();
    if (!isRecord(value)) return undefined;
    const endpointSlug = stringValue(value.endpointSlug);
    const server = stringValue(value.server);
    if (!endpointSlug || server === undefined) return undefined;
    return {
      endpointSlug,
      server,
      bearerToken: stringValue(value.bearerToken) ?? "",
      body: stringValue(value.body),
      parameters: stringRecord(value.parameters),
    };
  } catch {
    return undefined;
  }
}

function requestUrl(
  endpoint: OpenApiRequestEndpoint,
  server: string,
  parameters: Record<string, string>,
  requestUrl: string,
) {
  let path = substitutePathParameters(endpoint.path, parameters);
  const query = new URLSearchParams();
  for (const parameter of endpoint.parameters) {
    if (parameter.in !== "query") continue;
    const value = parameters[`query:${parameter.name}`];
    if (value) query.set(parameter.name, value);
  }
  const search = query.toString();
  path = `${path}${search ? `?${search}` : ""}`;
  return server
    ? `${server.replace(/\/$/, "")}${path}`
    : new URL(path, requestUrl).toString();
}

/**
 * Replaces OpenAPI `{parameter}` placeholders without a backtracking regular
 * expression. Endpoint paths can come from a remote schema, so this remains
 * linear even for malformed input containing many unmatched braces.
 */
function substitutePathParameters(
  path: string,
  parameters: Record<string, string>,
): string {
  let output = "";
  let cursor = 0;

  while (cursor < path.length) {
    const openingBrace = path.indexOf("{", cursor);
    if (openingBrace === -1) return `${output}${path.slice(cursor)}`;

    const closingBrace = path.indexOf("}", openingBrace + 1);
    if (closingBrace === -1) return `${output}${path.slice(cursor)}`;

    const placeholder = path.slice(openingBrace, closingBrace + 1);
    const name = path.slice(openingBrace + 1, closingBrace);
    const value = name ? parameters[`path:${name}`] : undefined;
    output += path.slice(cursor, openingBrace);
    output += value ? encodeURIComponent(value) : placeholder;
    cursor = closingBrace + 1;
  }

  return output;
}

function requestHeaders(
  endpoint: OpenApiRequestEndpoint,
  parameters: Record<string, string>,
  bearerToken: string,
) {
  const headers = new Headers();
  for (const parameter of endpoint.parameters) {
    if (parameter.in !== "header") continue;
    const value = parameters[`header:${parameter.name}`];
    if (value) headers.set(parameter.name, value);
  }
  if (endpoint.requestBody?.contentType)
    headers.set("Content-Type", endpoint.requestBody.contentType);
  if (bearerToken) headers.set("Authorization", `Bearer ${bearerToken}`);
  return headers;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
