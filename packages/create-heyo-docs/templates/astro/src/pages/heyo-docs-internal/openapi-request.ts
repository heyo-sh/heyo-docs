import type { APIRoute } from "astro";

import { handleOpenApiRequest } from "../../lib/openapi-request";

/** The only dynamic OpenAPI surface: a same-origin proxy for Try it requests. */
export const prerender = false;

export const POST: APIRoute = ({ request }) => handleOpenApiRequest(request);
