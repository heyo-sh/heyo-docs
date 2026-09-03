import { z } from "zod";

const openpanelClientIdSchema = z.string().trim().min(1).max(256);
const openpanelApiUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  }, "OpenPanel apiUrl must be an HTTPS URL without a query or fragment.");

/**
 * Source of truth: https://openpanel.dev/docs/sdks/script
 *
 * OpenPanel's script-tag SDK queues configuration before loading and, with
 * `trackScreenViews: true`, detects SPA navigation through the History API.
 */
export const openpanelAnalyticsSchema = z
  .object({
    clientId: openpanelClientIdSchema,
    apiUrl: openpanelApiUrlSchema.optional(),
  })
  .strict();

export type OpenpanelAnalyticsConfig = z.infer<typeof openpanelAnalyticsSchema>;

/** Loads OpenPanel's queued, browser-only SDK after its initialization call. */
export function openpanelScript() {
  return {
    async: true,
    defer: true,
    src: "https://openpanel.dev/op1.js",
  } as const;
}

/** Enables automatic screen-view tracking with public configuration attributes. */
export function openpanelBootstrapScript(): string {
  return `(function(){var s=document.currentScript;var clientId=s&&s.getAttribute("data-openpanel-client-id");var apiUrl=s&&s.getAttribute("data-openpanel-api-url");if(!clientId){return;}window.op=window.op||function(){var q=[];return new Proxy(function(){arguments.length&&q.push([].slice.call(arguments));},{get:function(t,p){return p==="q"?q:function(){q.push([p].concat([].slice.call(arguments)));};},has:function(t,p){return p==="q";}});}();var options={clientId:clientId,trackScreenViews:true,trackOutgoingLinks:true,trackAttributes:true};if(apiUrl){options.apiUrl=apiUrl;}window.op("init",options);})();`;
}
