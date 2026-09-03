import { z } from "zod";

const chaskiqBaseUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  }, "Chaskiq baseUrl must be an HTTPS URL without a query or fragment.")
  .transform((value) => value.replace(/\/$/, ""));

const chaskiqWebSocketUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "wss:" && url.search === "" && url.hash === "";
  }, "Chaskiq wsUrl must be a WSS URL without a query or fragment.");

/**
 * Source of truth: https://dev.chaskiq.io/getting-started/introduccion
 *
 * Chaskiq's current `embed.js` exports `ChaskiqMessengerEncrypted`. Its own
 * anonymous help-centre layout instantiates that messenger with an empty
 * `data` object, a public app ID, and the instance's HTTP/WebSocket endpoints.
 * This integration deliberately does not accept an authenticated visitor
 * payload, because that value has to be produced by the host application's
 * server.
 */
export const chaskiqSupportSchema = z
  .object({
    appId: z.string().trim().min(1).max(256),
    baseUrl: chaskiqBaseUrlSchema,
    wsUrl: chaskiqWebSocketUrlSchema.optional(),
  })
  .strict();

export type ChaskiqSupportConfig = z.infer<typeof chaskiqSupportSchema>;

/** Loads and initializes Chaskiq's anonymous browser messenger. */
export function chaskiqBootstrapScript(): string {
  return `(function(){var d=document;var s=d.currentScript;var appId=s&&s.getAttribute("data-chaskiq-app-id");var baseUrl=s&&s.getAttribute("data-chaskiq-base-url");var wsUrl=s&&s.getAttribute("data-chaskiq-ws-url");if(!appId||!baseUrl){return;}var g=d.createElement("script");g.src=baseUrl+"/embed.js";g.async=true;g.onload=function(){if(typeof window.ChaskiqMessengerEncrypted!=="function"){return;}window.chaskiqMessenger=new window.ChaskiqMessengerEncrypted({domain:baseUrl,ws:wsUrl||baseUrl.replace(/^https:/,"wss:")+"/cable",data:{},app_id:appId});};var first=d.getElementsByTagName("script")[0];if(first&&first.parentNode){first.parentNode.insertBefore(g,first);}else{d.head.appendChild(g);}})();`;
}
