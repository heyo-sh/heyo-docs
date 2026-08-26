import { handleOpenApiRequest } from "../../lib/openapi-request";

export async function POST(request: Request) {
  return handleOpenApiRequest(request);
}
