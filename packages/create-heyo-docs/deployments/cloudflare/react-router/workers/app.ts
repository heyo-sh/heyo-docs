import { createRequestHandler, RouterContextProvider } from "react-router";

const handleRequest = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  fetch(request) {
    return handleRequest(request, new RouterContextProvider());
  },
} satisfies ExportedHandler<Env>;
