import type { ActionFunctionArgs } from "react-router";

import config from "../../heyo-docs.config";
import { pages } from "virtual:heyo-docs-content";
import { pages as markdownPages } from "virtual:heyo-docs-content/server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", {
      headers: { Allow: "POST" },
      status: 405,
    });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return Response.json(
      { error: "OPENAI_API_KEY is not configured." },
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
