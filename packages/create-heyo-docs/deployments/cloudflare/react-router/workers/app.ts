import { createRequestHandler, RouterContextProvider } from "react-router";

import { cloudflareContext } from "../app/lib/cloudflare-context";

const handleRequest = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  fetch(request, env) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, env);
    return handleRequest(request, context);
  },
} satisfies ExportedHandler<Env>;
