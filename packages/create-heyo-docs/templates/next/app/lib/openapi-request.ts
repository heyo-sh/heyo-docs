import { handleOpenApiRequest as forwardOpenApiRequest } from "@heyo-sh/heyo-docs/openapi/request";

import { docsModel } from "./docs";

/** Same-origin Try It proxy constrained to servers declared by the OpenAPI schema. */
export async function handleOpenApiRequest(
  request: Request,
): Promise<Response> {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  return forwardOpenApiRequest(request, docsModel.endpoints);
}
