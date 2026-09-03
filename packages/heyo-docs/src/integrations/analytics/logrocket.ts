import { z } from "zod";

const logRocketAppIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(256)
  .regex(
    /^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/,
    "LogRocket appId must be in the form organization/application.",
  );

/**
 * Source of truth: https://docs.logrocket.com/reference/init
 *
 * LogRocket loads its browser SDK and initializes it as early as possible in
 * the document. The SDK captures browser history navigation in session replay,
 * so initialization does not need a framework route callback.
 */
export const logRocketAnalyticsSchema = z
  .object({ appId: logRocketAppIdSchema })
  .strict();

export type LogRocketAnalyticsConfig = z.infer<typeof logRocketAnalyticsSchema>;

/** Loads LogRocket's browser SDK before its adjacent initialization snippet. */
export function logRocketScript() {
  return {
    crossOrigin: "anonymous",
    src: "https://cdn.logr-in.com/LogRocket.min.js",
  } as const;
}

/** Initializes the synchronously loaded SDK from its public app ID. */
export function logRocketBootstrapScript(): string {
  return `var appId=document.currentScript&&document.currentScript.getAttribute("data-logrocket-app-id");if(appId&&window.LogRocket){window.LogRocket.init(appId);}`;
}
