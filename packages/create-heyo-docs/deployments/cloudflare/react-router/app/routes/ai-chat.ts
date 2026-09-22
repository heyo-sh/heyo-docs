import type { ActionFunctionArgs } from "react-router";

import config from "../../heyo-docs.config";
import { cloudflareContext } from "../lib/cloudflare-context";
import { pages } from "virtual:heyo-docs-content";
import { pages as markdownPages } from "virtual:heyo-docs-content/server";

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  if (!config.ai?.chat)
    return Response.json(
      { error: "AI chat is not configured." },
      { status: 404 },
    );
  const bindings = context.get(cloudflareContext);
  const token = bindings.HEYO_DOCS_AI_API_KEY ?? bindings.OPENAI_API_KEY;
  const { createAiChatResponse } = await import("@heyo-sh/heyo-docs/ai");
  return createAiChatResponse(request, {
    ai: config.ai,
    ...(config.ai?.chat.auth || !token
      ? {}
      : { auth: { type: "api-key" as const, token } }),
    markdownPages,
    pages,
    title: config.title,
  });
}
