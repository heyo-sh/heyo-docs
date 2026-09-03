import { z } from "zod";

const clarityProjectIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, "Clarity projectId contains invalid characters.");

/**
 * Source of truth: https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup
 *
 * Microsoft Clarity supplies a project-specific loader for the document head.
 * Its asynchronous loader queues calls made before the tracking library arrives.
 */
export const clarityAnalyticsSchema = z
  .object({ projectId: clarityProjectIdSchema })
  .strict();

export type ClarityAnalyticsConfig = z.infer<typeof clarityAnalyticsSchema>;

/**
 * Produces Clarity's queued loader. The project ID comes from the script data
 * attribute, avoiding construction of executable source from configuration.
 */
export function clarityBootstrapScript(): string {
  return `(function(){var d=document;var projectId=d.currentScript&&d.currentScript.getAttribute("data-clarity-project-id");if(!projectId){return;}var w=window;var c=w.clarity||function(){(c.q=c.q||[]).push(arguments);};w.clarity=c;var s=d.createElement("script");s.async=true;s.src=new URL(encodeURIComponent(projectId),"https://www.clarity.ms/tag/").href;var f=d.getElementsByTagName("script")[0];f.parentNode.insertBefore(s,f);})();`;
}
