/** Cloudflare Worker secret configured with `wrangler secret put`. */
interface CloudflareEnv {
  /** Preferred generic API-key binding; provider-specific auth stays in config. */
  HEYO_DOCS_AI_API_KEY?: string;
}
