import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { markdownForPage } from "./llm";
import { searchPages } from "./search";
import type { AiConfig, MarkdownPage, SearchDocument } from "./types";

export interface AiChatOptions {
  ai?: AiConfig;
  pages: SearchDocument[];
  markdownPages: MarkdownPage[];
  title: string;
}

export async function createAiChatResponse(
  request: Request,
  { ai, pages, markdownPages, title }: AiChatOptions,
): Promise<Response> {
  const chat = ai?.chat;
  if (!chat)
    return Response.json(
      { error: "AI chat is not configured." },
      { status: 404 },
    );

  let messages: UIMessage[];
  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages) || body.messages.length > 50)
      return Response.json(
        { error: "Invalid chat messages." },
        { status: 400 },
      );
    messages = body.messages;
  } catch {
    return Response.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const model = await languageModelFor(chat);
  const markdownByPath = new Map(
    markdownPages.map((page) => [page.slug, page]),
  );
  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages, {
      ignoreIncompleteToolCalls: true,
    });
  } catch {
    return Response.json({ error: "Invalid chat messages." }, { status: 400 });
  }
  const result = streamText({
    model,
    system: [
      `You are the documentation assistant for ${title}.`,
      "Answer only from the documentation available through your tools.",
      "Search documentation before reading a page. If the answer is not documented, say that you do not know.",
      "Cite documentation pages inline with Markdown links such as [Quickstart](/quickstart).",
    ].join("\n"),
    messages: modelMessages,
    tools: {
      searchDocs: tool({
        description: "Search the documentation for relevant pages.",
        inputSchema: z.object({
          query: z.string().trim().min(1),
        }),
        execute: async ({ query }) => {
          const results = searchPages(pages, query);
          if (!results.length) return "No documentation pages found.";
          return results
            .map(
              (page) =>
                `- [${page.title}](${page.slug}): ${page.description || "No description."}`,
            )
            .join("\n");
        },
      }),
      getPageContent: tool({
        description:
          "Read a documentation page returned by searchDocs. Pass its path.",
        inputSchema: z.object({
          path: z.string().trim().min(1),
        }),
        execute: async ({ path }) => {
          const pathname = new URL(path, "https://heyo-docs.local").pathname;
          const page = markdownByPath.get(pathname);
          return page
            ? markdownForPage(page)
            : "Documentation page not found. Use searchDocs first.";
        },
      }),
    },
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onError: () => "AI chat could not complete this request.",
  });
}

async function languageModelFor(chat: NonNullable<AiConfig["chat"]>) {
  if (chat.provider === "openai") {
    const { createOpenAI } = await import("@ai-sdk/openai");
    return createOpenAI({ apiKey: chat.key })(chat.model);
  }
  if (chat.provider === "claude") {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    return createAnthropic({ apiKey: chat.key })(chat.model);
  }
  const { createXai } = await import("@ai-sdk/xai");
  return createXai({ apiKey: chat.key })(chat.model);
}
