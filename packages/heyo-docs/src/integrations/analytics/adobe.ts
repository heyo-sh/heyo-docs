import { z } from "zod";

const adobeLaunchUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => new URL(value).protocol === "https:",
    "Adobe Analytics launchUrl must use HTTPS.",
  );

/**
 * Source of truth: https://experienceleague.adobe.com/en/docs/experience-platform/tags/client-side/asynchronous-deployment
 *
 * Adobe Experience Platform Tags supports an asynchronous launch script in
 * the document head. The configured URL comes from the Adobe environment's
 * generated embed code.
 */
export const adobeAnalyticsSchema = z
  .object({ launchUrl: adobeLaunchUrlSchema })
  .strict();

export type AdobeAnalyticsConfig = z.infer<typeof adobeAnalyticsSchema>;

/**
 * The Adobe Launch script is safe to load asynchronously. Adobe controls the
 * contents of the configured Launch URL and initializes its own data layer.
 */
export function adobeAnalyticsScript(config: AdobeAnalyticsConfig) {
  return { async: true, src: config.launchUrl } as const;
}
