import { z } from "zod";

/** Configuration for the Intercom Messenger widget. */
export const intercomSupportSchema = z
  .object({ appId: z.string().trim().min(6) })
  .strict();

export type IntercomSupportConfig = z.infer<typeof intercomSupportSchema>;

/**
 * Produces Intercom's browser bootstrap snippet for one application. It keeps
 * the vendor queue intact until the Messenger script finishes loading.
 */
export function intercomBootstrapScript(config: IntercomSupportConfig): string {
  const settings = JSON.stringify({ app_id: config.appId }).replace(
    /</g,
    "\\u003c",
  );
  const widgetUrl = JSON.stringify(
    `https://widget.intercom.io/widget/${encodeURIComponent(config.appId)}`,
  );

  return `window.intercomSettings=${settings};(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic("reattach_activator");ic("update",w.intercomSettings);return;}var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement("script");s.type="text/javascript";s.async=true;s.src=${widgetUrl};var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x);};if(d.readyState==="complete"){l();}else if(w.attachEvent){w.attachEvent("onload",l);}else{w.addEventListener("load",l,false);}})();`;
}
