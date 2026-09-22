import { createDocsModel } from "@heyo-sh/heyo-docs/model";
import { handleOpenApiRequest as forwardOpenApiRequest } from "@heyo-sh/heyo-docs/openapi/request";

import config from "../../heyo-docs.config";
import { openApiDocuments } from "virtual:heyo-docs-openapi";
import { pages } from "virtual:heyo-docs-content";

export async function handleOpenApiRequest(
  request: Request,
): Promise<Response> {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  return forwardOpenApiRequest(
    request,
    createDocsModel(config, pages, openApiDocuments).endpoints,
  );
}
