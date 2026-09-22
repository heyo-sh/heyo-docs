/** Cloudflare Worker secret configured with `wrangler secret put`. */
interface CloudflareEnv {
  /** Preferred generic API-key binding; provider-specific auth stays in config. */
  HEYO_DOCS_AI_API_KEY?: string;
  /** @deprecated Use HEYO_DOCS_AI_API_KEY or config.ai.chat.auth. */
  OPENAI_API_KEY?: string;
}
