import { z } from "zod";

const rybbitSiteIdSchema = z.string().trim().min(1).max(256);
const rybbitScriptUrlSchema = z
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
  }, "Rybbit scriptUrl must be an HTTPS JavaScript URL without a query or fragment.");

/**
 * Source of truth: https://www.rybbit.io/docs/guides/react/gatsby
 *
 * Rybbit's head script automatically detects client-side route changes and
 * records them as page views. The optional script URL supports self-hosted
 * Rybbit instances while retaining the documented cloud default.
 */
export const rybbitAnalyticsSchema = z
  .object({
    siteId: rybbitSiteIdSchema,
    scriptUrl: rybbitScriptUrlSchema.optional(),
  })
  .strict();

export type RybbitAnalyticsConfig = z.infer<typeof rybbitAnalyticsSchema>;

const defaultRybbitScriptUrl = "https://app.rybbit.io/api/script.js";

/** Produces Rybbit's deferred, SPA-aware tracker-script attributes. */
export function rybbitAnalyticsScript(config: RybbitAnalyticsConfig) {
  return {
    defer: true,
    siteId: config.siteId,
    src: config.scriptUrl ?? defaultRybbitScriptUrl,
  } as const;
}
