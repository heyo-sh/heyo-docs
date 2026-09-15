import { createAiChatResponse } from "@heyo-sh/heyo-docs/ai";

import config from "../../../heyo-docs.config";
import { docsPages, markdownPages } from "../../_heyo-docs/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return Response.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );

  return createAiChatResponse(request, {
    ai: config.ai,
    auth: { type: "api-key", token: apiKey },
    markdownPages,
    pages: docsPages,
    title: config.title,
  });
}
