import { z } from "zod";

const plausibleDomainSchema = z
  .string()
  .trim()
  .min(1)
  .max(253)
  .regex(
    /^(?=.{1,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/,
    "Plausible domain must be a valid hostname.",
  );

/**
 * Source of truth: https://plausible.io/docs/spa-support
 *
 * Plausible's deferred tracker automatically observes History API navigation
 * for pushState-based SPA routers, including React and Next.js.
 */
export const plausibleAnalyticsSchema = z
  .object({ domain: plausibleDomainSchema })
  .strict();

export type PlausibleAnalyticsConfig = z.infer<typeof plausibleAnalyticsSchema>;

/** Produces Plausible's standard SPA-aware tracking-script attributes. */
export function plausibleAnalyticsScript(config: PlausibleAnalyticsConfig) {
  return {
    defer: true,
    domain: config.domain,
    src: "https://plausible.io/js/script.js",
  } as const;
}
