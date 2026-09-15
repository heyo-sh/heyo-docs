import { createAiChatResponse } from "@heyo-sh/heyo-docs/ai";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

import config from "../../../heyo-docs.config";
import { pages as markdownPages } from "virtual:heyo-docs-content/server";

export const prerender = false;

export const POST: APIRoute = ({ request }) => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey)
    return Response.json(
      { error: "The OPENAI_API_KEY Worker secret is not configured." },
      { status: 500 },
    );

  return createAiChatResponse(request, {
    ai: config.ai,
    auth: { type: "api-key", token: apiKey },
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
