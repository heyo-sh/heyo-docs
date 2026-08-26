import type { EntryContext, RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

export const streamTimeout = 5_000;

/** Web Streams entry required by Cloudflare Workers and build prerendering. */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  let shellRendered = false;
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: AbortSignal.timeout(streamTimeout + 1_000),
      onError(error: unknown) {
        responseStatusCode = 500;
        if (shellRendered) console.error(error);
      },
    },
  );
  shellRendered = true;

  if (
    (request.headers.get("user-agent") &&
      isbot(request.headers.get("user-agent")!)) ||
    routerContext.isSpaMode
  )
    await body.allReady;

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
