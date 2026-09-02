import { z } from "zod";

/** Configuration for the Intercom Messenger widget. */
export const intercomSupportSchema = z
  .object({ appId: z.string().trim().min(6) })
  .strict();

export type IntercomSupportConfig = z.infer<typeof intercomSupportSchema>;

/**
 * Produces Intercom's browser bootstrap snippet. The app ID is supplied by
 * the framework template as a data attribute, so configuration never becomes
 * part of constructed JavaScript source.
 */
export function intercomBootstrapScript(): string {
  return `(function(){var d=document;var appId=d.currentScript&&d.currentScript.getAttribute("data-intercom-app-id");if(!appId){return;}var w=window;w.intercomSettings={app_id:appId};var ic=w.Intercom;if(typeof ic==="function"){ic("reattach_activator");ic("update",w.intercomSettings);return;}var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement("script");s.type="text/javascript";s.async=true;s.src=new URL(encodeURIComponent(appId),"https://widget.intercom.io/widget/").href;var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x);};if(d.readyState==="complete"){l();}else if(w.attachEvent){w.attachEvent("onload",l);}else{w.addEventListener("load",l,false);}})();`;
}
