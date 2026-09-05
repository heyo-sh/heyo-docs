import { z } from "zod";

const amplitudeApiKeySchema = z.string().trim().min(1).max(512);

/**
 * Source of truth: https://www.amplitude.com/docs/sdks/analytics/browser/browser-unified-sdk
 *
 * Amplitude's Unified Script is a single CDN script whose URL includes the
 * project's public API key. It belongs in the document head.
 */
export const amplitudeAnalyticsSchema = z
  .object({ apiKey: amplitudeApiKeySchema })
  .strict();

export type AmplitudeAnalyticsConfig = z.infer<typeof amplitudeAnalyticsSchema>;

/** Loads Amplitude's current Unified Script for the configured public API key. */
export function amplitudeAnalyticsScript(config: AmplitudeAnalyticsConfig) {
  return {
    src: new URL(
      `${encodeURIComponent(config.apiKey)}.js`,
      "https://cdn.amplitude.com/script/",
    ).href,
  } as const;
}
