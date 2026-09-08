import { expect, test } from "bun:test";

import { createAiChatResponse } from "../src/ai";

test("streams an OpenAI response through the AI SDK chat protocol", async () => {
  const originalFetch = globalThis.fetch;
  const events = [
    {
      type: "response.created",
      response: { id: "response-test", created_at: 0, model: "gpt-5-mini" },
    },
    {
      type: "response.output_text.delta",
      item_id: "item-test",
      output_index: 0,
      delta: "Hello from the test model.",
    },
    { type: "response.completed", response: {} },
  ];
  globalThis.fetch = (async () =>
    new Response(
      `${events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")}data: [DONE]\n\n`,
      { headers: { "content-type": "text/event-stream" } },
    )) as unknown as typeof fetch;

  try {
    const response = await createAiChatResponse(
      new Request("http://localhost/heyo-docs-internal/ai-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              id: "message-1",
              role: "user",
              parts: [{ type: "text", text: "Hello" }],
            },
          ],
        }),
      }),
      {
        ai: {
          chat: {
            provider: "openai",
            key: "test-key",
            model: "gpt-5-mini",
            variant: "right",
            icon: "chat",
            text: "AI Chat",
            name: "AI",
            placeholder: "Ask AI about the docs",
          },
        },
        markdownPages: [],
        pages: [],
        title: "Test docs",
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(await response.text()).toContain("Hello from the test model.");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
