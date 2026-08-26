import type { OpenApiEndpoint } from "../../../types";
import { CodeBlock, CodeBlockGroup } from "../documentation/mdx-components";

function pathWithParameters(
  endpoint: OpenApiEndpoint,
  parameters: Record<string, string>,
) {
  return endpoint.path.replace(/\{([^}]+)\}/g, (match, name: string) => {
    const value = parameters[`path:${name}`];
    return value ? encodeURIComponent(value) : match;
  });
}

function requestUrl(
  endpoint: OpenApiEndpoint,
  server: string,
  parameters: Record<string, string>,
) {
  const path = pathWithParameters(endpoint, parameters);
  const query = new URLSearchParams();
  for (const parameter of endpoint.parameters) {
    if (parameter.in !== "query") continue;
    const value = parameters[`query:${parameter.name}`];
    if (value) query.set(parameter.name, value);
  }
  const base = server.replace(/\/$/, "");
  const search = query.toString();
  return `${base}${path}${search ? `?${search}` : ""}`;
}

function shellEscape(value: string) {
  return `'${value.replaceAll("'", "'\\\"'\\\"")}'`;
}

function headersFor(
  endpoint: OpenApiEndpoint,
  parameters: Record<string, string>,
  bearerToken: string,
) {
  const headers: Record<string, string> = {};
  for (const parameter of endpoint.parameters) {
    if (parameter.in !== "header") continue;
    const value = parameters[`header:${parameter.name}`];
    if (value) headers[parameter.name] = value;
  }
  if (endpoint.requestBody?.contentType)
    headers["Content-Type"] = endpoint.requestBody.contentType;
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
  return headers;
}

function curlExample(
  endpoint: OpenApiEndpoint,
  server: string,
  parameters: Record<string, string>,
  bearerToken: string,
  body: string,
) {
  const url = requestUrl(endpoint, server, parameters);
  const headers = headersFor(endpoint, parameters, bearerToken);
  const lines = [
    `curl --request ${endpoint.method.toUpperCase()} \\`,
    `  ${shellEscape(url)} \\`,
    ...Object.entries(headers).map(
      ([name, value]) => `  --header ${shellEscape(`${name}: ${value}`)} \\`,
    ),
  ];
  if (body.trim()) lines.push(`  --data ${shellEscape(body.trim())} \\`);
  lines[lines.length - 1] = lines[lines.length - 1]!.replace(/ \\$/, "");
  return lines.join("\n");
}

function fetchExample(
  endpoint: OpenApiEndpoint,
  server: string,
  parameters: Record<string, string>,
  bearerToken: string,
  body: string,
) {
  const url = requestUrl(endpoint, server, parameters);
  const headers = headersFor(endpoint, parameters, bearerToken);
  const options = {
    method: endpoint.method.toUpperCase(),
    ...(Object.keys(headers).length ? { headers } : {}),
    ...(body.trim() ? { body: body.trim() } : {}),
  };
  return `const response = await fetch(${JSON.stringify(url)}, ${JSON.stringify(
    options,
    null,
    2,
  )});\n\nconst data = await response.json();`;
}

function responseExample(value: unknown) {
  return typeof value === "string"
    ? value
    : (JSON.stringify(value, null, 2) ?? "");
}

function responseLanguage(contentType: string | undefined) {
  return contentType?.toLowerCase().includes("json") ? "json" : "text";
}

const codeClassName = "[&_.shiki]:text-xs [&_.shiki]:leading-5";

export function OpenApiExample({
  bearerToken,
  body,
  endpoint,
  parameters,
  server,
}: {
  bearerToken: string;
  body: string;
  endpoint: OpenApiEndpoint;
  parameters: Record<string, string>;
  server: string;
}) {
  const curl = curlExample(endpoint, server, parameters, bearerToken, body);
  const fetchCode = fetchExample(
    endpoint,
    server,
    parameters,
    bearerToken,
    body,
  );
  const responsesWithExamples = endpoint.responses.filter(
    (response) => response.example !== undefined,
  );

  return (
    <aside className="min-w-0">
      <CodeBlockGroup variant="default">
        <CodeBlock className={codeClassName} language="bash" title="cURL">
          {curl}
        </CodeBlock>
        <CodeBlock
          className={codeClassName}
          language="javascript"
          title="JavaScript"
        >
          {fetchCode}
        </CodeBlock>
      </CodeBlockGroup>
      {responsesWithExamples.length ? (
        <CodeBlockGroup variant="default">
          {responsesWithExamples.map((response) => (
            <CodeBlock
              className={codeClassName}
              key={response.status}
              language={responseLanguage(response.contentType)}
              title={response.status}
            >
              {responseExample(response.example)}
            </CodeBlock>
          ))}
        </CodeBlockGroup>
      ) : null}
    </aside>
  );
}
