import cloudflare from "@astrojs/cloudflare";

/** Cloudflare Workers keeps interactive OpenAPI requests server-side. */
export const platformAdapter = cloudflare();
