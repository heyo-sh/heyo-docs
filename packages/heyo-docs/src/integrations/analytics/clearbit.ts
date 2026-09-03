import { z } from "zod";

const clearbitPublishableKeySchema = z
  .string()
  .trim()
  .min(4)
  .max(512)
  .regex(
    /^pk_[A-Za-z0-9_-]+$/,
    "Clearbit publishableKey must start with pk_ and contain only URL-safe characters.",
  );

/**
 * Source of truth: https://help.clearbit.com/hc/en-us/articles/360063559573-Install-Clearbit-JavaScript
 *
 * Clearbit JavaScript is copied from the Clearbit dashboard and installed in
 * the document head. Clearbit loads synchronously while its managed tags are
 * appended asynchronously.
 */
export const clearbitAnalyticsSchema = z
  .object({ publishableKey: clearbitPublishableKeySchema })
  .strict();

export type ClearbitAnalyticsConfig = z.infer<typeof clearbitAnalyticsSchema>;

/** Loads Clearbit's tag script with its public, referrer-restricted key. */
export function clearbitAnalyticsScript(config: ClearbitAnalyticsConfig) {
  return {
    src: new URL(
      `v1/${encodeURIComponent(config.publishableKey)}/tags.js`,
      "https://tag.clearbitscripts.com/",
    ).href,
  } as const;
}
