import { createAiChatResponse } from "@heyo-sh/heyo-docs/ai";

import config from "../../../heyo-docs.config";
import { docsPages, markdownPages } from "../../_heyo-docs/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return createAiChatResponse(request, {
    ai: config.ai,
    markdownPages,
    pages: docsPages,
    title: config.title,
  });
}
