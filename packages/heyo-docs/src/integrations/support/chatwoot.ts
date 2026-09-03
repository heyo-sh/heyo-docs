import { z } from "zod";

const chatwootBaseUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  }, "Chatwoot baseUrl must be an HTTPS URL without a query or fragment.")
  .transform((value) => value.replace(/\/$/, ""));

const chatwootWebsiteTokenSchema = z.string().trim().min(1).max(256);

/**
 * Source of truth: https://www.chatwoot.com/hc/user-guide/articles/1677677232-how-to-install-live_chat-on-a-vue-js-app
 *
 * Chatwoot asynchronously loads `/packs/js/sdk.js` from the configured
 * instance, then calls `chatwootSDK.run` with its public website token and
 * base URL after that SDK is ready.
 */
export const chatwootSupportSchema = z
  .object({
    baseUrl: chatwootBaseUrlSchema,
    websiteToken: chatwootWebsiteTokenSchema,
  })
  .strict();

export type ChatwootSupportConfig = z.infer<typeof chatwootSupportSchema>;

/** Produces Chatwoot's documented SDK loader without interpolating config. */
export function chatwootBootstrapScript(): string {
  return `(function(){var d=document;var s=d.currentScript;var baseUrl=s&&s.getAttribute("data-chatwoot-base-url");var websiteToken=s&&s.getAttribute("data-chatwoot-website-token");if(!baseUrl||!websiteToken){return;}var g=d.createElement("script");g.src=baseUrl+"/packs/js/sdk.js";g.defer=true;g.async=true;g.onload=function(){if(window.chatwootSDK&&typeof window.chatwootSDK.run==="function"){window.chatwootSDK.run({websiteToken:websiteToken,baseUrl:baseUrl});}};var first=d.getElementsByTagName("script")[0];if(first&&first.parentNode){first.parentNode.insertBefore(g,first);}else{d.head.appendChild(g);}})();`;
}
