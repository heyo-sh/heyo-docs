import { z } from "zod";

const googleTagManagerContainerIdSchema = z
  .string()
  .trim()
  .regex(
    /^GTM-[A-Z0-9]+$/,
    "Google Tag Manager containerId must start with GTM-.",
  );

/**
 * Source of truth: https://support.google.com/tagmanager/answer/14847097
 *
 * Google Tag Manager requires its asynchronous loader high in the document
 * head and a noscript iframe immediately after the opening body tag.
 */
export const googleTagManagerSchema = z
  .object({ containerId: googleTagManagerContainerIdSchema })
  .strict();

export type GoogleTagManagerConfig = z.infer<typeof googleTagManagerSchema>;

/** Loads the Tag Manager container and its data layer from a data attribute. */
export function googleTagManagerBootstrapScript(): string {
  return `(function(){var d=document;var containerId=d.currentScript&&d.currentScript.getAttribute("data-google-tag-manager-container-id");if(!containerId){return;}var w=window;w.dataLayer=w.dataLayer||[];w.dataLayer.push({"gtm.start":new Date().getTime(),event:"gtm.js"});var s=d.createElement("script");s.async=true;s.src=new URL("gtm.js?id="+encodeURIComponent(containerId),"https://www.googletagmanager.com/").href;var f=d.getElementsByTagName("script")[0];f.parentNode.insertBefore(s,f);})();`;
}

/** Produces the non-JavaScript fallback URL used directly after <body>. */
export function googleTagManagerNoScriptUrl(config: GoogleTagManagerConfig) {
  return new URL(
    `ns.html?id=${encodeURIComponent(config.containerId)}`,
    "https://www.googletagmanager.com/",
  ).href;
}
