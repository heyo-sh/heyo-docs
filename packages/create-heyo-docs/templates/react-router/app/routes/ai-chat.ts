import { createAiChatResponse } from "@heyo-sh/heyo-docs/ai";
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

  return createAiChatResponse(request, {
    ai: config.ai,
    markdownPages,
    pages,
    title: config.title,
  });
}
