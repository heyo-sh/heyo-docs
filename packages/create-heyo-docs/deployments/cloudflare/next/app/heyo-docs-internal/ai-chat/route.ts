import { getCloudflareContext } from "@opennextjs/cloudflare";

import config from "../../../heyo-docs.config";
import { docsPages, markdownPages } from "../../_heyo-docs/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!config.ai?.chat)
    return Response.json(
      { error: "AI chat is not configured." },
      { status: 404 },
    );

  const { env } = getCloudflareContext();
  const token = env.HEYO_DOCS_AI_API_KEY;
  const { createAiChatResponse } = await import("@heyo-sh/heyo-docs/ai");
  return createAiChatResponse(request, {
    ai: config.ai,
    ...(config.ai?.chat.auth || !token
      ? {}
      : { auth: { type: "api-key" as const, token } }),
    markdownPages,
    pages: docsPages,
    title: config.title,
  });
}
