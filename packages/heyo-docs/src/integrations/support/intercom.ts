import { z } from "zod";

const intercomApiBaseSchema = z.enum([
  "https://api-iam.intercom.io",
  "https://api-iam.eu.intercom.io",
  "https://api-iam.au.intercom.io",
]);

/**
 * Source of truth: https://developers.intercom.com/installing-intercom/web/installation
 *
 * Intercom boots Messenger with a public workspace ID, its regional API base,
 * and its asynchronous widget loader. The configuration is deliberately
 * supplied outside the inline script.
 */
export const intercomSupportSchema = z
  .object({
    appId: z.string().trim().min(6),
    apiBase: intercomApiBaseSchema.optional(),
  })
  .strict();

export type IntercomSupportConfig = z.infer<typeof intercomSupportSchema>;

/**
 * Produces Intercom's browser bootstrap snippet. The app ID and regional API
 * base are supplied by the framework template as data attributes, so
 * configuration never becomes part of constructed JavaScript source.
 */
export function intercomBootstrapScript(): string {
  return `(function(){var d=document;var current=d.currentScript;var appId=current&&current.getAttribute("data-intercom-app-id");if(!appId){return;}var apiBase=(current&&current.getAttribute("data-intercom-api-base"))||"https://api-iam.intercom.io";var w=window;var settings={app_id:appId,api_base:apiBase};w.intercomSettings=settings;var ic=w.Intercom;var update=function(){w.Intercom("update");};var observe=function(){if(w.__heyoIntercomRouteObserver){return;}w.__heyoIntercomRouteObserver=true;var h=w.history;var onRouteChange=function(){w.setTimeout(update,0);};if(h){var pushState=h.pushState;h.pushState=function(){var result=pushState.apply(h,arguments);onRouteChange();return result;};var replaceState=h.replaceState;h.replaceState=function(){var result=replaceState.apply(h,arguments);onRouteChange();return result;};}w.addEventListener("popstate",onRouteChange,false);w.addEventListener("hashchange",onRouteChange,false);};if(typeof ic==="function"){ic("update",settings);observe();return;}var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;i("boot",settings);var l=function(){var s=d.createElement("script");s.type="text/javascript";s.async=true;s.src=new URL(encodeURIComponent(appId),"https://widget.intercom.io/widget/").href;var x=d.getElementsByTagName("script")[0];x.parentNode.insertBefore(s,x);};observe();if(d.readyState==="complete"){l();}else if(w.attachEvent){w.attachEvent("onload",l);}else{w.addEventListener("load",l,false);}})();`;
}
