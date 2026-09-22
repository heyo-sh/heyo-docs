import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import config from "../../../heyo-docs.config";
import { pages as markdownPages } from "virtual:heyo-docs-content/server";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!config.ai?.chat)
    return Response.json(
      { error: "AI chat is not configured." },
      { status: 404 },
    );

  const token = env.HEYO_DOCS_AI_API_KEY ?? env.OPENAI_API_KEY;
  const { createAiChatResponse } = await import("@heyo-sh/heyo-docs/ai");
  return createAiChatResponse(request, {
    ai: config.ai,
    ...(config.ai?.chat.auth || !token
      ? {}
      : { auth: { type: "api-key" as const, token } }),
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
