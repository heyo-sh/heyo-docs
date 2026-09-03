import { z } from "zod";

const heapEnvironmentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, "Heap environmentId contains invalid characters.");

/**
 * Source of truth: https://developers.heap.io/docs/web
 *
 * Heap's asynchronous browser loader belongs before the closing head tag. By
 * default Heap also captures page views caused by History API navigation.
 */
export const heapAnalyticsSchema = z
  .object({ environmentId: heapEnvironmentIdSchema })
  .strict();

export type HeapAnalyticsConfig = z.infer<typeof heapAnalyticsSchema>;

/**
 * Produces Heap's queued loader. The environment ID is read from a data
 * attribute, so it is not assembled into executable inline JavaScript.
 */
export function heapBootstrapScript(): string {
  return `(function(){var d=document;var environmentId=d.currentScript&&d.currentScript.getAttribute("data-heap-environment-id");if(!environmentId){return;}var w=window;var h=w.heap=w.heap||[];w.heapReadyCb=w.heapReadyCb||[];h.load=function(e,t){h.envId=e;h.clientConfig=t=t||{};h.clientConfig.shouldFetchServerConfig=false;var a=d.createElement("script");a.type="text/javascript";a.async=true;a.src=new URL(encodeURIComponent(e)+"/heap_config.js","https://cdn.us.heap-api.com/config/").href;var r=d.getElementsByTagName("script")[0];r.parentNode.insertBefore(a,r);var n=["init","startTracking","stopTracking","track","resetIdentity","identify","identifyHashed","getSessionId","getUserId","getIdentity","addUserProperties","addEventProperties","removeEventProperty","clearEventProperties","addAccountProperties","addAdapter","addTransformer","addTransformerFn","onReady","addPageviewProperties","removePageviewProperty","clearPageviewProperties","trackPageview"],i=function(name){return function(){var args=Array.prototype.slice.call(arguments,0);w.heapReadyCb.push({name:name,fn:function(){h[name]&&h[name].apply(h,args);}});};};for(var p=0;p<n.length;p++){h[n[p]]=i(n[p]);}};h.load(environmentId);})();`;
}
