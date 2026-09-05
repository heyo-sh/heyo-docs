import { z } from "zod";

const swetrixProjectIdSchema = z.string().trim().min(1).max(256);
const swetrixApiUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  }, "Swetrix apiUrl must be an HTTPS URL without a query or fragment.");

/**
 * Source of truth: https://swetrix.com/docs/install-script
 *
 * Swetrix initializes once after its deferred tracker loads. `trackViews()`
 * then observes History API URL changes, so ordinary SPA routes need no
 * framework-specific callback. A self-hosted API endpoint is optional.
 */
export const swetrixAnalyticsSchema = z
  .object({
    projectId: swetrixProjectIdSchema,
    apiUrl: swetrixApiUrlSchema.optional(),
  })
  .strict();

export type SwetrixAnalyticsConfig = z.infer<typeof swetrixAnalyticsSchema>;

/** Loads Swetrix's browser SDK with the documented deferred behavior. */
export function swetrixScript() {
  return { defer: true, src: "https://swetrix.org/swetrix.js" } as const;
}

/** Initializes Swetrix once the document and deferred SDK are ready. */
export function swetrixBootstrapScript(): string {
  return `(function(){var s=document.currentScript;var projectId=s&&s.getAttribute("data-swetrix-project-id");var apiUrl=s&&s.getAttribute("data-swetrix-api-url");if(!projectId){return;}function start(){if(!window.swetrix){return;}var options={};if(apiUrl){options.apiURL=apiUrl;}window.swetrix.init(projectId,options);window.swetrix.trackViews();}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",start);}else{start();}})();`;
}
