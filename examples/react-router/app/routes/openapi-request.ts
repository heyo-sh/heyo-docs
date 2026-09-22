import { createDocsModel } from "@heyo-sh/heyo-docs/model";
import { handleOpenApiRequest } from "@heyo-sh/heyo-docs/openapi/request";
import type { ActionFunctionArgs } from "react-router";

import config from "../../heyo-docs.config";
import { pages } from "virtual:heyo-docs-content";
import { openApiDocuments } from "virtual:heyo-docs-openapi";

export function loader() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });

  return handleOpenApiRequest(
    request,
    createDocsModel(config, pages, openApiDocuments).endpoints,
  );
}
