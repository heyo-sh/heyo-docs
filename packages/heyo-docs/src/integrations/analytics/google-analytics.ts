import { z } from "zod";

const googleAnalyticsMeasurementIdSchema = z
  .string()
  .trim()
  .regex(
    /^G-[A-Z0-9]+$/,
    "Google Analytics measurementId must be a GA4 ID starting with G-.",
  );

/**
 * Source of truth: https://support.google.com/analytics/answer/14183469
 *
 * Google Analytics 4 installs the Google tag immediately after the opening
 * head. The tag loads gtag.js asynchronously, then initializes its data layer
 * and sends the measurement ID's default page view.
 */
export const googleAnalyticsSchema = z
  .object({ measurementId: googleAnalyticsMeasurementIdSchema })
  .strict();

export type GoogleAnalyticsConfig = z.infer<typeof googleAnalyticsSchema>;

/** Produces the asynchronous Google tag script URL for a GA4 measurement ID. */
export function googleAnalyticsScript(config: GoogleAnalyticsConfig) {
  return {
    async: true,
    src: new URL(
      `gtag/js?id=${encodeURIComponent(config.measurementId)}`,
      "https://www.googletagmanager.com/",
    ).href,
  } as const;
}

/**
 * Initializes Google Analytics without interpolating configuration into the
 * inline source. Framework templates pass the ID as a data attribute instead.
 */
export function googleAnalyticsBootstrapScript(): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());var measurementId=document.currentScript&&document.currentScript.getAttribute("data-google-analytics-measurement-id");if(measurementId){gtag("config",measurementId);}`;
}
