import type { ActionFunctionArgs } from "react-router";

import config from "../../heyo-docs.config";
import { cloudflareContext } from "../lib/cloudflare-context";
import { pages } from "virtual:heyo-docs-content";
import { pages as markdownPages } from "virtual:heyo-docs-content/server";

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", {
      headers: { Allow: "POST" },
      status: 405,
    });

  const apiKey = context.get(cloudflareContext).OPENAI_API_KEY;
  if (!apiKey)
    return Response.json(
      { error: "The OPENAI_API_KEY Worker secret is not configured." },
      { status: 500 },
    );

  const { createAiChatResponse } = await import("@heyo-sh/heyo-docs/ai");
  return createAiChatResponse(request, {
    ai: config.ai,
    auth: { type: "api-key", token: apiKey },
    markdownPages,
    pages,
    title: config.title,
  });
}
