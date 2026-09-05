import { z } from "zod";

const umamiWebsiteIdSchema = z.string().trim().min(1).max(256);
const umamiScriptUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.pathname.endsWith(".js") &&
      url.search === "" &&
      url.hash === ""
    );
  }, "Umami scriptUrl must be an HTTPS JavaScript URL without a query or fragment.");

/**
 * Source of truth: https://docs.umami.is/docs/guides/track-single-page-apps
 *
 * Umami's tracker belongs in the document head and automatically watches the
 * History API for client-side navigation. A script URL is required so this
 * configuration supports both Umami Cloud and self-hosted installations.
 */
export const umamiAnalyticsSchema = z
  .object({
    websiteId: umamiWebsiteIdSchema,
    scriptUrl: umamiScriptUrlSchema,
  })
  .strict();

export type UmamiAnalyticsConfig = z.infer<typeof umamiAnalyticsSchema>;

/** Produces Umami's deferred, SPA-aware tracker-script attributes. */
export function umamiAnalyticsScript(config: UmamiAnalyticsConfig) {
  return {
    defer: true,
    src: config.scriptUrl,
    websiteId: config.websiteId,
  } as const;
}
