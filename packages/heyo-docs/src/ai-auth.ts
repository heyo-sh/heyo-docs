import type { AiChatAuth } from "./types";

const API_KEY_AUTH_TYPES = ["api-key"] as const;
const OAUTH_AUTH_TYPES = ["oauth"] as const;
const BEDROCK_AUTH_TYPES = ["aws", "bedrock-bearer"] as const;
const OAUTH_PROVIDERS = new Set(["github-copilot", "openai-codex"]);

/** Returns the Pi authentication mechanisms supported by a provider. */
export function authTypesForAiProvider(
  provider: string,
): readonly AiChatAuth["type"][] {
  if (provider === "amazon-bedrock") return BEDROCK_AUTH_TYPES;
  if (OAUTH_PROVIDERS.has(provider)) return OAUTH_AUTH_TYPES;
  return API_KEY_AUTH_TYPES;
}
