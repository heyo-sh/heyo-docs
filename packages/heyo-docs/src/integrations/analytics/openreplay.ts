import { z } from "zod";

const openReplayProjectKeySchema = z.string().trim().min(1).max(256);
const openReplayIngestPointSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  }, "OpenReplay ingestPoint must be an HTTPS URL without a query or fragment.");

/**
 * Source of truth: https://docs.openreplay.com/en/deployment/setup-or/
 *
 * OpenReplay supports its project-specific browser snippet directly in the
 * document head. It starts one tracker after loading; it does not require a
 * callback for each Next.js or React Router route transition.
 */
export const openReplayAnalyticsSchema = z
  .object({
    projectKey: openReplayProjectKeySchema,
    ingestPoint: openReplayIngestPointSchema.optional(),
  })
  .strict();

export type OpenReplayAnalyticsConfig = z.infer<
  typeof openReplayAnalyticsSchema
>;

/**
 * Produces OpenReplay's documented queued loader from public data attributes.
 * `ingestPoint` is only needed for a self-hosted OpenReplay installation.
 */
export function openReplayBootstrapScript(): string {
  return `(function(){var s=document.currentScript;var projectKey=s&&s.getAttribute("data-openreplay-project-key");var ingestPoint=s&&s.getAttribute("data-openreplay-ingest-point");if(!projectKey){return;}var initOpts={projectKey:projectKey};if(ingestPoint){initOpts.ingestPoint=ingestPoint;}var startOpts={};(function(A,n,a,y,e,r){r=window.OpenReplay=[e,r,y,[n-1,e]];n=document.createElement("script");n.src=A;n.async=!a;document.getElementsByTagName("head")[0].appendChild(n);r.start=function(){r.push([0]);};r.stop=function(){r.push([1]);};r.setUserID=function(id){r.push([2,id]);};r.setUserAnonymousID=function(id){r.push([3,id]);};r.setMetadata=function(k,v){r.push([4,k,v]);};r.event=function(k,p,i){r.push([5,k,p,i]);};r.issue=function(k,p){r.push([6,k,p]);};r.isActive=function(){return false;};r.getSessionToken=function(){};})("https://static.openreplay.com/latest/openreplay.js",1,0,initOpts,startOpts);})();`;
}
