import config from "../../../heyo-docs.config";
import { docsPages, markdownPages } from "../../_heyo-docs/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!config.ai?.chat)
    return Response.json(
      { error: "AI chat is not configured." },
      { status: 404 },
    );

  // Pi's provider catalogue is a server-only optional feature. Importing it
  // only for an enabled request keeps static docs builds free of AI runtime.
  const { createAiChatResponse } = await import("@heyo-sh/heyo-docs/ai");
  return createAiChatResponse(request, {
    ai: config.ai,
    markdownPages,
    pages: docsPages,
    title: config.title,
  });
}
