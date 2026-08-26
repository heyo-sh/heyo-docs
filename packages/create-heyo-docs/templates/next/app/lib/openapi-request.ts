import { findOpenApiEndpoint } from "@heyo-sh/heyo-docs/node";
import type { OpenApiEndpoint } from "@heyo-sh/heyo-docs";

import { docsModel } from "./docs";

interface OpenApiRequestPayload {
  bearerToken: string;
  body?: string;
  endpointSlug: string;
  parameters: Record<string, string>;
  server: string;
}

/** Sends documented API calls server-side after validating the declared server. */
export async function handleOpenApiRequest(
  request: Request,
): Promise<Response> {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", {
      headers: { Allow: "POST" },
      status: 405,
    });
  const payload = await requestPayload(request);
  if (!payload)
    return new Response("Invalid OpenAPI request.", { status: 400 });
  const endpoint = findOpenApiEndpoint(
    docsModel.endpoints,
    payload.endpointSlug,
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
      { headers, status: response.status, statusText: response.statusText },
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
  endpoint: OpenApiEndpoint,
  server: string,
  parameters: Record<string, string>,
  requestUrl: string,
) {
  const path = endpoint.path.replace(
    /\{([^}]+)\}/g,
    (match: string, name: string) => {
      const value = parameters[`path:${name}`];
      return value ? encodeURIComponent(value) : match;
    },
  );
  const query = new URLSearchParams();
  for (const parameter of endpoint.parameters) {
    if (parameter.in !== "query") continue;
    const value = parameters[`query:${parameter.name}`];
    if (value) query.set(parameter.name, value);
  }
  const destination = `${path}${query.size ? `?${query}` : ""}`;
  return server
    ? `${server.replace(/\/$/, "")}${destination}`
    : new URL(destination, requestUrl).toString();
}

function requestHeaders(
  endpoint: OpenApiEndpoint,
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
