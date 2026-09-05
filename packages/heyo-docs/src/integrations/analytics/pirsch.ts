import { z } from "zod";

const pirschIdentificationCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Pirsch identificationCode contains invalid characters.",
  );

/**
 * Source of truth: https://docs.pirsch.io/get-started/frontend-integration
 *
 * Pirsch's deferred `pa.js` script receives the public identification code as
 * a data attribute and tracks programmatic URL changes by default.
 */
export const pirschAnalyticsSchema = z
  .object({ identificationCode: pirschIdentificationCodeSchema })
  .strict();

export type PirschAnalyticsConfig = z.infer<typeof pirschAnalyticsSchema>;

/** Produces Pirsch's SPA-aware, deferred tracking-script attributes. */
export function pirschAnalyticsScript(config: PirschAnalyticsConfig) {
  return {
    code: config.identificationCode,
    defer: true,
    src: "https://api.pirsch.io/pa.js",
  } as const;
}
