"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { markdownPathname } from "../../../llm";
import { openApiEndpointDataPath } from "../../../openapi";
import type {
  OpenApiEndpoint,
  OpenApiPageProps,
  OpenApiParameter,
} from "../../../types";
import { Property, Properties } from "../documentation/mdx-components";
import { CopyForLlm } from "../actions/copy-for-llm";
import { Open } from "../actions/open";
import { PageNavigation } from "../actions/navigation";
import { OpenApiDescription } from "./description";
import { OpenApiExample } from "./example";
import { OpenApiSchemaTree } from "./schema";

type ResponseState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; body: string; status: string };

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringifyExample(value: unknown) {
  if (value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function parameterKey(parameter: OpenApiParameter) {
  return `${parameter.in}:${parameter.name}`;
}

function defaultParameterValues(endpoint: OpenApiEndpoint) {
  return Object.fromEntries(
    endpoint.parameters.map((parameter) => [
      parameterKey(parameter),
      stringifyExample(parameter.example),
    ]),
  );
}

function bearerScheme(endpoint: OpenApiEndpoint): string | undefined {
  const requirements = endpoint.security
    .map(asRecord)
    .filter((requirement) => Object.keys(requirement).length > 0);
  return Object.entries(endpoint.securitySchemes).find(([name, rawScheme]) => {
    const scheme = asRecord(rawScheme);
    const isBearer =
      scheme.type === "http" &&
      typeof scheme.scheme === "string" &&
      scheme.scheme.toLowerCase() === "bearer";
    return isBearer && requirements.some((requirement) => name in requirement);
  })?.[0];
}

function serverUrl(endpoint: OpenApiEndpoint) {
  return endpoint.servers[0] ?? "";
}

function buildRequestUrl(
  endpoint: OpenApiEndpoint,
  server: string,
  parameters: Record<string, string>,
) {
  let path = endpoint.path.replace(/\{([^}]+)\}/g, (match, name: string) => {
    const value = parameters[`path:${name}`];
    return value ? encodeURIComponent(value) : match;
  });
  const query = new URLSearchParams();
  for (const parameter of endpoint.parameters) {
    if (parameter.in !== "query") continue;
    const value = parameters[parameterKey(parameter)];
    if (value) query.set(parameter.name, value);
  }
  const search = query.toString();
  path = `${path}${search ? `?${search}` : ""}`;
  return server ? `${server.replace(/\/$/, "")}${path}` : path;
}

function typeLabel(parameter: OpenApiParameter) {
  const schema = parameter.schema;
  if (!schema) return "string";
  return schema.format
    ? `${schema.type ?? "string"} · ${schema.format}`
    : (schema.type ?? "string");
}

function Parameters({
  endpoint,
  onChange,
  values,
}: {
  endpoint: OpenApiEndpoint;
  onChange: (key: string, value: string) => void;
  values: Record<string, string>;
}) {
  const document = endpoint.document ?? { paths: {} };
  const parameters = endpoint.parameters.filter((parameter) =>
    ["path", "query", "header"].includes(parameter.in),
  );
  if (!parameters.length) return null;
  return (
    <section aria-labelledby="parameters-heading" className="mt-10">
      <div className="mb-3">
        <h2
          className="text-xl font-semibold tracking-tight"
          id="parameters-heading"
        >
          Parameters
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Values are applied to the request and the example on the right.
        </p>
      </div>
      <Properties className="mb-0 mt-3">
        {parameters.map((parameter) => (
          <Property
            badges={
              parameter.deprecated ? (
                <Badge className="rounded-md px-2" variant="outline">
                  deprecated
                </Badge>
              ) : undefined
            }
            key={parameterKey(parameter)}
            name={parameter.name}
            required={parameter.required}
            type={`${parameter.in} · ${typeLabel(parameter)}`}
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,15rem)] sm:items-center sm:gap-5">
              {parameter.description ? (
                <OpenApiDescription
                  className="text-sm leading-6 text-muted-foreground"
                  document={document}
                >
                  {parameter.description}
                </OpenApiDescription>
              ) : (
                <span />
              )}
              <Input
                aria-label={`${parameter.name} ${parameter.in} parameter`}
                onChange={(event) =>
                  onChange(parameterKey(parameter), event.target.value)
                }
                placeholder={
                  parameter.required ? `Enter ${parameter.name}` : "Optional"
                }
                value={values[parameterKey(parameter)] ?? ""}
              />
            </div>
            {parameter.schema ? (
              <OpenApiSchemaTree
                className="mt-6"
                document={document}
                schema={parameter.schema}
              />
            ) : null}
          </Property>
        ))}
      </Properties>
    </section>
  );
}

function Response({ response }: { response: ResponseState }) {
  if (response.kind === "idle") return null;
  return (
    <section aria-live="polite" className="mt-8" id="response">
      <h2 className="text-xl font-semibold tracking-tight">Response</h2>
      {response.kind === "loading" ? (
        <Properties className="mb-0 mt-3">
          <Property name="Request" showRequired={false} type="loading">
            <p className="text-sm text-muted-foreground">Sending request…</p>
          </Property>
        </Properties>
      ) : response.kind === "error" ? (
        <Properties className="mb-0 mt-3">
          <Property
            badges={<Badge variant="destructive">error</Badge>}
            name="Request"
            showRequired={false}
          >
            <p className="text-sm text-destructive">{response.message}</p>
          </Property>
        </Properties>
      ) : (
        <Properties className="mb-0 mt-3">
          <Property name="Status" showRequired={false} type={response.status}>
            <pre className="max-h-96 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-6 text-foreground/80">
              <code>{response.body || "(empty response)"}</code>
            </pre>
          </Property>
        </Properties>
      )}
    </section>
  );
}

function DocumentedResponses({ endpoint }: { endpoint: OpenApiEndpoint }) {
  const document = endpoint.document ?? { paths: {} };
  if (!endpoint.responses.length) return null;
  return (
    <section className="mt-10" aria-labelledby="responses-heading">
      <h2
        className="text-xl font-semibold tracking-tight"
        id="responses-heading"
      >
        Responses
      </h2>
      <Properties className="mb-0 mt-3">
        {endpoint.responses.map((response) => (
          <Property
            key={response.status}
            name={response.status}
            showRequired={false}
            type={response.contentType}
          >
            {response.description ? (
              <OpenApiDescription
                className="mt-2 text-sm text-muted-foreground"
                document={document}
              >
                {response.description}
              </OpenApiDescription>
            ) : null}
            {response.example !== undefined ? (
              <pre className="mt-3 overflow-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-5 text-foreground/80">
                <code>{stringifyExample(response.example)}</code>
              </pre>
            ) : null}
            {response.schema ? (
              <OpenApiSchemaTree
                className="mt-6"
                document={document}
                schema={response.schema}
              />
            ) : null}
          </Property>
        ))}
      </Properties>
    </section>
  );
}

export function OpenApiPage({
  endpoint: indexedEndpoint,
  next,
  openApiRequestUrl,
  previous,
}: OpenApiPageProps) {
  const [resolvedEndpoint, setResolvedEndpoint] = useState<
    OpenApiEndpoint | undefined
  >(() => (indexedEndpoint.document ? indexedEndpoint : undefined));
  const endpoint =
    resolvedEndpoint?.slug === indexedEndpoint.slug
      ? resolvedEndpoint
      : indexedEndpoint;
  // Built-in static adapters supply the active endpoint in the page output, so
  // its first painted UI is already complete. The static JSON shard remains a
  // fallback for custom integrations that provide only the compact index.
  const document = endpoint.document ?? { paths: {} };
  const [parameters, setParameters] = useState(() =>
    defaultParameterValues(endpoint),
  );
  const [body, setBody] = useState(() =>
    stringifyExample(endpoint.requestBody?.example),
  );
  const [server, setServer] = useState(() => serverUrl(endpoint));
  const [response, setResponse] = useState<ResponseState>({ kind: "idle" });
  const scheme = useMemo(() => bearerScheme(endpoint), [endpoint]);
  const persistenceKey = scheme
    ? `heyo-docs:openapi:bearer:${endpoint.groupIndex}:${endpoint.sectionIndex}:${scheme}`
    : undefined;
  const [bearerToken, setBearerToken] = useState("");
  const markdownUrl = markdownPathname(endpoint.slug);

  useEffect(() => {
    if (indexedEndpoint.document) return;
    const controller = new AbortController();
    setResolvedEndpoint(undefined);
    void fetch(openApiEndpointDataPath(indexedEndpoint.slug), {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((value: unknown) => {
        if (
          !controller.signal.aborted &&
          typeof value === "object" &&
          value !== null
        )
          setResolvedEndpoint(value as OpenApiEndpoint);
      })
      .catch(() => {
        // The compact index remains usable if a full endpoint cannot load.
      });
    return () => controller.abort();
  }, [indexedEndpoint]);

  useEffect(() => {
    setParameters(defaultParameterValues(endpoint));
    setBody(stringifyExample(endpoint.requestBody?.example));
    setServer(serverUrl(endpoint));
    setResponse({ kind: "idle" });
  }, [endpoint]);

  useEffect(() => {
    if (!persistenceKey) return;
    try {
      setBearerToken(window.localStorage.getItem(persistenceKey) ?? "");
    } catch {
      // Private browsing or a restrictive browser setting should not break docs.
    }
  }, [persistenceKey]);

  function updateBearerToken(value: string) {
    setBearerToken(value);
    if (!persistenceKey) return;
    try {
      if (value) window.localStorage.setItem(persistenceKey, value);
      else window.localStorage.removeItem(persistenceKey);
    } catch {
      // The request editor still works for this visit when storage is unavailable.
    }
  }

  async function sendRequest() {
    const missing = endpoint.parameters.find(
      (parameter) =>
        parameter.required &&
        ["path", "query", "header"].includes(parameter.in) &&
        !parameters[parameterKey(parameter)]?.trim(),
    );
    if (missing) {
      setResponse({
        kind: "error",
        message: `Enter the required ${missing.name} ${missing.in} parameter before sending the request.`,
      });
      return;
    }

    let requestBody: string | undefined;
    if (body.trim()) {
      if (endpoint.requestBody?.contentType.toLowerCase().includes("json")) {
        try {
          JSON.parse(body);
        } catch {
          setResponse({
            kind: "error",
            message: "The request body must be valid JSON.",
          });
          return;
        }
      }
      requestBody = body;
    } else if (endpoint.requestBody?.required) {
      setResponse({
        kind: "error",
        message: "Enter the required request body before sending the request.",
      });
      return;
    }

    const headers = new Headers();
    endpoint.parameters.forEach((parameter) => {
      if (parameter.in !== "header") return;
      const value = parameters[parameterKey(parameter)];
      if (value) headers.set(parameter.name, value);
    });
    if (requestBody && endpoint.requestBody?.contentType)
      headers.set("Content-Type", endpoint.requestBody.contentType);
    if (bearerToken) headers.set("Authorization", `Bearer ${bearerToken}`);

    setResponse({ kind: "loading" });
    try {
      const result = await fetch(
        openApiRequestUrl ?? buildRequestUrl(endpoint, server, parameters),
        openApiRequestUrl
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bearerToken,
                body: requestBody,
                endpointSlug: endpoint.slug,
                parameters,
                server,
              }),
            }
          : {
              method: endpoint.method.toUpperCase(),
              headers,
              body: requestBody,
            },
      );
      const rawBody = await result.text();
      let renderedBody = rawBody;
      try {
        renderedBody = JSON.stringify(JSON.parse(rawBody), null, 2);
      } catch {
        // Preserve text, empty, and binary-compatible responses as returned.
      }
      setResponse({
        kind: "success",
        status: `${result.status} ${result.statusText}`.trim(),
        body: renderedBody,
      });
    } catch (error) {
      const guidance = openApiRequestUrl
        ? "The request proxy could not be reached."
        : "Check the API server URL and its CORS policy.";
      setResponse({
        kind: "error",
        message:
          error instanceof Error
            ? `${error.message} ${guidance}`
            : `The request could not be sent. ${guidance}`,
      });
    }
  }

  return (
    <div className="min-w-0">
      <div className="grid gap-y-10 xl:grid-cols-[minmax(0,46rem)_minmax(15rem,22.5rem)] xl:gap-x-12">
        <article className="min-w-0 max-w-[46rem]">
          <header className="border-b border-foreground/[0.06] pb-8">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge className="rounded-md px-2">
                {endpoint.method.toUpperCase()}
              </Badge>
              <code className="min-w-0 break-all rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground/70">
                {endpoint.path}
              </code>
            </div>
            <div className="mt-5 flex items-start justify-between gap-4">
              <h1 className="min-w-0 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-[2.625rem]">
                {endpoint.title}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                <CopyForLlm markdownUrl={markdownUrl} />
                <Open markdownUrl={markdownUrl} />
              </div>
            </div>
            {endpoint.description ? (
              <OpenApiDescription
                className="mt-4 max-w-2xl text-[1.0625rem] leading-7 text-muted-foreground"
                document={document}
              >
                {endpoint.description}
              </OpenApiDescription>
            ) : null}
          </header>

          <section aria-labelledby="request-heading" className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  className="text-xl font-semibold tracking-tight"
                  id="request-heading"
                >
                  Send request
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the documented inputs to call this endpoint directly.
                </p>
              </div>
              <Button onClick={sendRequest} size="lg" type="button">
                {response.kind === "loading" ? "Sending…" : "Send request"}
              </Button>
            </div>
            <Properties className="mb-0 mt-4">
              <Property name="API server" showRequired={false} type="base URL">
                {endpoint.servers.length > 1 ? (
                  <select
                    aria-label="API server"
                    className="h-10 rounded-md border border-input bg-input/20 px-3 text-sm text-foreground dark:bg-input/30"
                    onChange={(event) => setServer(event.target.value)}
                    value={server}
                  >
                    {endpoint.servers.map((candidate) => (
                      <option key={candidate} value={candidate}>
                        {candidate}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    aria-label="API server"
                    onChange={(event) => setServer(event.target.value)}
                    placeholder="https://api.example.com"
                    value={server}
                  />
                )}
                {!server ? (
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    No server is defined in the schema, so the request uses this
                    documentation site's origin.
                  </p>
                ) : null}
              </Property>
              {scheme ? (
                <Property name="Bearer token" type={scheme}>
                  <Input
                    aria-describedby="bearer-persistence"
                    autoComplete="off"
                    onChange={(event) => updateBearerToken(event.target.value)}
                    placeholder="Paste a token"
                    type="password"
                    value={bearerToken}
                  />
                  <span
                    className="text-xs font-normal leading-5 text-muted-foreground"
                    id="bearer-persistence"
                  >
                    Stored only in this browser for the {scheme} security scheme
                    and reused on every API page in this group.
                  </span>
                </Property>
              ) : null}
            </Properties>
          </section>

          <Parameters
            endpoint={endpoint}
            onChange={(key, value) =>
              setParameters((current) => ({ ...current, [key]: value }))
            }
            values={parameters}
          />

          {endpoint.requestBody ? (
            <section aria-labelledby="request-body-heading" className="mt-10">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2
                  className="text-xl font-semibold tracking-tight"
                  id="request-body-heading"
                >
                  Request body
                </h2>
                <Badge className="rounded-md font-mono" variant="outline">
                  {endpoint.requestBody.contentType}
                </Badge>
                {endpoint.requestBody.required ? (
                  <Badge className="rounded-md" variant="destructive">
                    required
                  </Badge>
                ) : null}
              </div>
              {endpoint.requestBody.description ? (
                <OpenApiDescription
                  className="mb-3 text-sm text-muted-foreground"
                  document={document}
                >
                  {endpoint.requestBody.description}
                </OpenApiDescription>
              ) : null}
              <Textarea
                aria-label="Request body"
                className="min-h-12 max-h-52 font-mono text-xs leading-6"
                onChange={(event) => setBody(event.target.value)}
                spellCheck={false}
                value={body}
              />
              {endpoint.requestBody.schema ? (
                <OpenApiSchemaTree
                  className="mt-6"
                  document={document}
                  schema={endpoint.requestBody.schema}
                />
              ) : null}
            </section>
          ) : null}

          <Response response={response} />
          <DocumentedResponses endpoint={endpoint} />
          <PageNavigation next={next} previous={previous} />
        </article>
        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <OpenApiExample
            bearerToken={bearerToken}
            body={body}
            endpoint={endpoint}
            parameters={parameters}
            server={server}
          />
        </div>
      </div>
    </div>
  );
}
