import type { APIRoute } from "astro";

import config from "../../../heyo-docs.config";
import { pages as markdownPages } from "virtual:heyo-docs-content/server";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!config.ai?.chat)
    return Response.json(
      { error: "AI chat is not configured." },
      { status: 404 },
    );

  const { createAiChatResponse } = await import("@heyo-sh/heyo-docs/ai");
  return createAiChatResponse(request, {
    ai: config.ai,
    markdownPages,
    pages: markdownPages.map((page) => ({
      description: page.description,
      searchContent: page.raw,
      slug: page.slug,
      title: page.title,
    })),
    title: config.title,
  });
};
