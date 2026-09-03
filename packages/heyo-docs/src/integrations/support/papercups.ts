import { z } from "zod";

const papercupsBaseUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  }, "Papercups baseUrl must be an HTTPS URL without a query or fragment.")
  .transform((value) => value.replace(/\/$/, ""));

/**
 * Source of truth: https://github.com/papercups-io/chat-widget#using-in-html
 *
 * Papercups reads `window.Papercups.config` before its async `widget.js`
 * loader executes. The token and optional inbox are public widget values; no
 * customer identity or server API key can be configured here.
 */
export const papercupsSupportSchema = z
  .object({
    token: z.string().trim().min(1).max(256),
    inbox: z.string().trim().min(1).max(256).optional(),
    baseUrl: papercupsBaseUrlSchema.optional(),
  })
  .strict();

export type PapercupsSupportConfig = z.infer<typeof papercupsSupportSchema>;

/** Adds Papercups' configuration before loading the instance widget. */
export function papercupsBootstrapScript(): string {
  return `(function(){var d=document;var s=d.currentScript;var token=s&&s.getAttribute("data-papercups-token");var inbox=s&&s.getAttribute("data-papercups-inbox");var baseUrl=(s&&s.getAttribute("data-papercups-base-url"))||"https://app.papercups.io";if(!token){return;}var config={token:token,baseUrl:baseUrl};if(inbox){config.inbox=inbox;}window.Papercups=window.Papercups||{};window.Papercups.config=config;var g=d.createElement("script");g.type="text/javascript";g.async=true;g.defer=true;g.src=baseUrl+"/widget.js";var first=d.getElementsByTagName("script")[0];if(first&&first.parentNode){first.parentNode.insertBefore(g,first);}else{d.head.appendChild(g);}})();`;
}
