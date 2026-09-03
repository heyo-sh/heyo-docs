import { z } from "zod";

const fathomSiteIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, "Fathom siteId contains invalid characters.");

/**
 * Source of truth: https://usefathom.com/docs/script/script-advanced
 *
 * Fathom's deferred head script accepts data-spa="auto" to record client-side
 * navigations in addition to the initial page view.
 */
export const fathomAnalyticsSchema = z
  .object({ siteId: fathomSiteIdSchema })
  .strict();

export type FathomAnalyticsConfig = z.infer<typeof fathomAnalyticsSchema>;

/** Produces Fathom's deferred, SPA-aware embed-script attributes. */
export function fathomAnalyticsScript(config: FathomAnalyticsConfig) {
  return {
    defer: true,
    siteId: config.siteId,
    spa: "auto",
    src: "https://cdn.usefathom.com/script.js",
  } as const;
}
