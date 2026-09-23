import { afterEach, expect, test } from "bun:test";
import {
  fauxAssistantMessage,
  getApiProvider,
  getModels,
  getProviders,
  registerFauxProvider,
  resetApiProviders,
  type FauxProviderRegistration,
} from "@mariozechner/pi-ai";

import { createAiChatResponse, piModelFor } from "../src/ai";

let registration: FauxProviderRegistration | undefined;
afterEach(() => {
  registration?.unregister();
  resetApiProviders();
  registration = undefined;
});

test("streams a Pi response through the Heyo Docs chat protocol", async () => {
  registration = registerFauxProvider({
    api: "openai-responses",
    provider: "openai",
  });
  registration.setResponses([
    fauxAssistantMessage("Hello from the test model."),
  ]);

  const response = await createAiChatResponse(
    new Request("http://localhost/heyo-docs-internal/ai-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            text: "What is this?",
          },
          {
            role: "assistant",
            text: "A documentation site.",
          },
          {
            role: "user",
            text: "Hello",
          },
        ],
      }),
    }),
    {
      ai: {
        copyForLLM: "enabled",
        openIn: "enabled",
        chat: {
          provider: "openai",
          model: "gpt-5-mini",
          auth: { type: "api-key", token: "test-key" },
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
  const events = (await response.text())
    .trim()
    .split("\n\n")
    .map((frame) => JSON.parse(frame.replace(/^data:\s*/, "")) as unknown)
    .filter(
      (event): event is { type: "text-delta"; text: string } =>
        typeof event === "object" &&
        event !== null &&
        "type" in event &&
        "text" in event &&
        event.type === "text-delta" &&
        typeof event.text === "string",
    );
  expect(events.map((event) => event.text).join("")).toBe(
    "Hello from the test model.",
  );
});

test("runs the configured AI authorization and rate-limit guard before provider work", async () => {
  const response = await createAiChatResponse(
    new Request("http://localhost/heyo-docs-internal/ai-chat", {
      method: "POST",
    }),
    {
      ai: {
        copyForLLM: "enabled",
        openIn: "enabled",
        authorize: () =>
          Response.json({ error: "Rate limit exceeded" }, { status: 429 }),
        chat: {
          provider: "openai",
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

  expect(response.status).toBe(429);
  await expect(response.json()).resolves.toEqual({
    error: "Rate limit exceeded",
  });
});

test("uses API keys supplied by the request handler", async () => {
  registration = registerFauxProvider({
    api: "openai-responses",
    provider: "openai",
  });
  registration.setResponses([fauxAssistantMessage("Resolved at runtime.")]);
  const response = await createAiChatResponse(
    new Request("http://localhost/heyo-docs-internal/ai-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", text: "Hello" }],
      }),
    }),
    {
      ai: {
        copyForLLM: "enabled",
        openIn: "enabled",
        chat: {
          provider: "openai",
          model: "gpt-5-mini",
          variant: "right",
          icon: "chat",
          text: "AI Chat",
          name: "AI",
          placeholder: "Ask AI about the docs",
        },
      },
      auth: { type: "api-key", token: "runtime-key" },
      markdownPages: [],
      pages: [],
      title: "Test docs",
    },
  );

  await response.text();
  expect(response.status).toBe(200);
});

test("rejects request credentials incompatible with the provider", async () => {
  const response = await createAiChatResponse(
    new Request("http://localhost/heyo-docs-internal/ai-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", text: "Hello" }],
      }),
    }),
    {
      ai: {
        copyForLLM: "enabled",
        openIn: "enabled",
        chat: {
          provider: "github-copilot",
          model: "gpt-5-mini",
          variant: "right",
          icon: "chat",
          text: "AI Chat",
          name: "AI",
          placeholder: "Ask AI about the docs",
        },
      },
      auth: { type: "api-key", token: "not-an-oauth-token" },
      markdownPages: [],
      pages: [],
      title: "Test docs",
    },
  );

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toMatchObject({
    error: expect.stringContaining("auth.type 'oauth'"),
  });
});

test("resolves every installed Pi model to its registered API executor", () => {
  const models = getProviders().flatMap((provider) =>
    getModels(provider).map((model) => ({ model, provider })),
  );

  expect(models.length).toBeGreaterThan(0);
  for (const { model, provider } of models) {
    expect(piModelFor(provider, model.id)).toBe(model);
    expect(getApiProvider(model.api)).toBeDefined();
  }

  expect(() => piModelFor("not-a-pi-provider", "model")).toThrow(
    "Pi does not support provider",
  );
  expect(() => piModelFor("openrouter", "not-a-catalog-model")).toThrow(
    "does not include model",
  );
});

test("rejects malformed and incomplete chat requests", async () => {
  const options = {
    ai: {
      copyForLLM: "enabled" as const,
      openIn: "enabled" as const,
      chat: {
        provider: "openai",
        model: "gpt-5-mini",
        auth: { type: "api-key" as const, token: "test-key" },
        variant: "right" as const,
        icon: "chat" as const,
        text: "AI Chat",
        name: "AI",
        placeholder: "Ask AI about the docs",
      },
    },
    markdownPages: [],
    pages: [],
    title: "Test docs",
  };
  const emptyResponse = await createAiChatResponse(
    new Request("http://localhost/heyo-docs-internal/ai-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    }),
    options,
  );
  expect(emptyResponse.status).toBe(400);
  expect(await emptyResponse.json()).toEqual({
    error: "Invalid chat messages.",
  });
});
