import { z } from "zod";

const hotjarSiteIdSchema = z.number().int().positive();
const hotjarSnippetVersionSchema = z.number().int().positive();

/**
 * Source of truth: https://help.hotjar.com/hc/en-us/articles/36819972345105-How-to-Install-Your-Hotjar-Tracking-Code
 *
 * Hotjar's tracking code belongs in the document head and queues calls before
 * loading the site-specific script. Its default SPA URL tracking observes
 * normal client-side URL changes without a framework callback.
 */
export const hotjarAnalyticsSchema = z
  .object({
    siteId: hotjarSiteIdSchema,
    snippetVersion: hotjarSnippetVersionSchema,
  })
  .strict();

export type HotjarAnalyticsConfig = z.infer<typeof hotjarAnalyticsSchema>;

/**
 * Produces Hotjar's queued browser loader. Both public values are read from
 * data attributes so configuration never becomes part of executable source.
 */
export function hotjarBootstrapScript(): string {
  return `(function(){var d=document;var c=d.currentScript;var siteId=c&&c.getAttribute("data-hotjar-site-id");var snippetVersion=c&&c.getAttribute("data-hotjar-snippet-version");if(!siteId||!snippetVersion){return;}var w=window;var h=w.hj=w.hj||function(){(h.q=h.q||[]).push(arguments);};w._hjSettings={hjid:Number(siteId),hjsv:Number(snippetVersion)};var s=d.createElement("script");s.async=true;s.src=new URL("c/hotjar-"+encodeURIComponent(siteId)+".js?sv="+encodeURIComponent(snippetVersion),"https://static.hotjar.com/").href;var f=d.getElementsByTagName("script")[0];f.parentNode.insertBefore(s,f);})();`;
}
