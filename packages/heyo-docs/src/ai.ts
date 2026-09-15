import {
  Agent,
  type AgentOptions,
  type AgentTool,
} from "@mariozechner/pi-agent-core";
import {
  getModel,
  getProviders,
  stream,
  type Api,
  type AssistantMessage,
  type Message,
  type Model,
} from "@mariozechner/pi-ai";
import { Type } from "typebox";

import { markdownForPage } from "./llm";
import { searchPages } from "./search";
import type {
  AiChatConfig,
  AiConfig,
  MarkdownPage,
  SearchDocument,
} from "./types";

const MAX_CHAT_MESSAGES = 50;
const MAX_AGENT_TURNS = 8;
const MAX_TOOL_CALLS = 8;

export interface AiChatOptions {
  ai?: AiConfig;
  pages: SearchDocument[];
  markdownPages: MarkdownPage[];
  title: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

type ChatStreamEvent =
  { type: "text-delta"; text: string } | { type: "done" } | { type: "error" };

/**
 * Creates a documentation-aware streaming chat response using Pi. Pi owns the
 * provider catalog. Authentication is explicit: API-key, OAuth, and Bedrock
 * credentials each use Pi's matching request mechanism.
 */
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

  const messages = await chatMessagesFrom(request);
  if (!messages)
    return Response.json({ error: "Invalid chat messages." }, { status: 400 });

  let model: Model<Api>;
  try {
    model = piModelFor(chat.provider, chat.model);
  } catch {
    return Response.json(
      { error: "AI chat provider or model is not supported by Pi." },
      { status: 500 },
    );
  }

  const markdownByPath = new Map(
    markdownPages.map((page) => [page.slug, page]),
  );
  return piChatStream(request, {
    chat,
    markdownByPath,
    messages,
    model,
    pages,
    title,
  });
}

/**
 * Resolves an explicitly configured model from Pi's installed catalog.
 */
export function piModelFor(provider: string, id: string): Model<Api> {
  if (!provider) throw new Error("Pi requires a configured provider.");
  if (!id) throw new Error("Pi requires a configured model.");

  const known = getModel(provider as never, id as never);
  if (known) return known as Model<Api>;
  if (!getProviders().includes(provider as never))
    throw new Error(`Pi does not support provider '${provider}'.`);
  throw new Error(`Pi provider '${provider}' does not include model '${id}'.`);
}

async function chatMessagesFrom(
  request: Request,
): Promise<ChatMessage[] | undefined> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return undefined;
  }
  if (!isRecord(body) || !Array.isArray(body.messages)) return undefined;
  if (!body.messages.length || body.messages.length > MAX_CHAT_MESSAGES)
    return undefined;

  const messages: ChatMessage[] = [];
  for (const message of body.messages) {
    if (!isRecord(message)) return undefined;
    if (message.role !== "user" && message.role !== "assistant")
      return undefined;
    if (typeof message.text !== "string" || !message.text.trim())
      return undefined;
    messages.push({ role: message.role, text: message.text });
  }
  return messages.at(-1)?.role === "user" ? messages : undefined;
}

function piChatStream(
  request: Request,
  options: {
    chat: NonNullable<AiConfig["chat"]>;
    markdownByPath: Map<string, MarkdownPage>;
    messages: ChatMessage[];
    model: Model<Api>;
    pages: SearchDocument[];
    title: string;
  },
): Response {
  let cancel = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let agent: Agent | undefined;
      let removeAbortListener = () => {};

      const send = (event: ChatStreamEvent) => {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };
      const finish = () => {
        if (closed) return;
        closed = true;
        removeAbortListener();
        controller.close();
      };
      const abort = () => {
        agent?.abort();
        removeAbortListener();
      };
      cancel = abort;

      if (request.signal.aborted) {
        finish();
        return;
      }

      try {
        const lastMessage = options.messages.at(-1);
        if (!lastMessage) throw new Error("A chat prompt is required.");
        agent = new Agent({
          initialState: {
            systemPrompt: documentationAssistantPrompt(options.title),
            model: options.model,
            thinkingLevel: "off",
            tools: documentationTools(options.pages, options.markdownByPath),
            messages: piHistory(options.messages.slice(0, -1), options.model),
          },
          ...piAgentAuthOptions(options.chat),
          maxRetryDelayMs: 5_000,
          toolExecution: "sequential",
        });

        let streamedText = false;
        let turns = 0;
        agent.subscribe((event) => {
          if (event.type === "turn_start") {
            turns += 1;
            if (turns > MAX_AGENT_TURNS) {
              agent?.abort();
              return;
            }
          }
          if (
            event.type === "message_start" &&
            event.message.role === "assistant"
          )
            streamedText = false;
          if (
            event.type === "message_update" &&
            event.assistantMessageEvent.type === "text_delta"
          ) {
            streamedText = true;
            send({
              type: "text-delta",
              text: event.assistantMessageEvent.delta,
            });
          }
          if (
            event.type === "message_end" &&
            event.message.role === "assistant" &&
            !streamedText
          ) {
            const text = assistantText(event.message);
            if (text) send({ type: "text-delta", text });
          }
        });

        const abortHandler = () => abort();
        request.signal.addEventListener("abort", abortHandler, { once: true });
        removeAbortListener = () =>
          request.signal.removeEventListener("abort", abortHandler);

        void agent
          .prompt(lastMessage.text)
          .then(() => {
            if (request.signal.aborted) return;
            send(
              agent?.state.errorMessage ? { type: "error" } : { type: "done" },
            );
          })
          .catch(() => {
            if (!request.signal.aborted) send({ type: "error" });
          })
          .finally(finish);
      } catch {
        send({ type: "error" });
        finish();
      }
    },
    cancel() {
      cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "cache-control": "no-cache, no-transform",
      "content-type": "text/event-stream; charset=utf-8",
    },
  });
}

function piAgentAuthOptions(
  chat: AiChatConfig,
): Pick<AgentOptions, "getApiKey" | "streamFn"> {
  const auth = chat.auth;
  switch (auth.type) {
    case "api-key":
      return { getApiKey: () => auth.token };
    case "oauth":
      return { getApiKey: () => auth.getAccessToken() };
    case "aws":
      return {
        streamFn: (model, context, streamOptions) =>
          stream(model, context, {
            ...streamOptions,
            ...(auth.region ? { region: auth.region } : {}),
            ...(auth.profile ? { profile: auth.profile } : {}),
          }),
      };
    case "bedrock-bearer":
      return {
        streamFn: (model, context, streamOptions) =>
          stream(model, context, {
            ...streamOptions,
            bearerToken: auth.token,
            ...(auth.region ? { region: auth.region } : {}),
          }),
      };
  }
}

function documentationAssistantPrompt(title: string): string {
  return [
    `You are the documentation assistant for ${title}.`,
    "Answer only from the documentation available through your tools.",
    "Search documentation before reading a page. If the answer is not documented, say that you do not know.",
    "Cite documentation pages inline with Markdown links such as [Quickstart](/quickstart).",
  ].join("\n");
}

function documentationTools(
  pages: SearchDocument[],
  markdownByPath: Map<string, MarkdownPage>,
): AgentTool[] {
  const budget = new ToolBudget();
  return [
    {
      name: "searchDocs",
      label: "Search documentation",
      description: "Search the documentation for relevant pages.",
      parameters: Type.Object({
        query: Type.String({ minLength: 1, maxLength: 500 }),
      }),
      async execute(_id, parameters) {
        budget.take();
        const query = (parameters as { query: string }).query.trim();
        if (!query)
          throw new Error("A documentation search query is required.");
        const results = searchPages(pages, query);
        if (!results.length) return toolText("No documentation pages found.");
        return toolText(
          results
            .map(
              (page) =>
                `- [${page.title}](${page.slug}): ${page.description || "No description."}`,
            )
            .join("\n"),
        );
      },
    },
    {
      name: "getPageContent",
      label: "Read documentation page",
      description:
        "Read a documentation page returned by searchDocs. Pass its path.",
      parameters: Type.Object({
        path: Type.String({ minLength: 1, maxLength: 2_000 }),
      }),
      async execute(_id, parameters) {
        budget.take();
        const path = (parameters as { path: string }).path.trim();
        if (!path) throw new Error("A documentation page path is required.");
        const pathname = new URL(path, "https://heyo-docs.local").pathname;
        const page = markdownByPath.get(pathname);
        return toolText(
          page
            ? markdownForPage(page)
            : "Documentation page not found. Use searchDocs first.",
        );
      },
    },
  ];
}

function piHistory(messages: ChatMessage[], model: Model<Api>): Message[] {
  const timestamp = Date.now();
  return messages.map((message, index) =>
    message.role === "user"
      ? {
          role: "user",
          content: message.text,
          timestamp: timestamp + index,
        }
      : {
          role: "assistant",
          content: [{ type: "text", text: message.text }],
          api: model.api,
          provider: model.provider,
          model: model.id,
          usage: {
            input: 0,
            output: 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: 0,
            cost: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              total: 0,
            },
          },
          stopReason: "stop",
          timestamp: timestamp + index,
        },
  );
}

function assistantText(message: AssistantMessage): string {
  return message.content
    .filter(
      (content): content is Extract<typeof content, { type: "text" }> =>
        content.type === "text",
    )
    .map((content) => content.text)
    .join("");
}

function toolText(text: string) {
  return { content: [{ type: "text" as const, text }], details: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

class ToolBudget {
  private used = 0;

  take(): void {
    this.used += 1;
    if (this.used > MAX_TOOL_CALLS)
      throw new Error("Heyo Docs AI chat tool-call limit reached.");
  }
}
