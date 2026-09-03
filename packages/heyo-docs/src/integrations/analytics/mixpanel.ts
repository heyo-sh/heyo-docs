import { z } from "zod";

const mixpanelProjectTokenSchema = z.string().trim().min(1).max(512);

/**
 * Source of truth: https://github.com/mixpanel/mixpanel-js/blob/master/doc/readme.io/javascript-full-api-reference.md
 *
 * Mixpanel's `track_pageview: "url-with-path"` setting observes URL changes
 * in a SPA. The project token is public and is read from a data attribute
 * after the browser library has loaded.
 */
export const mixpanelAnalyticsSchema = z
  .object({ projectToken: mixpanelProjectTokenSchema })
  .strict();

export type MixpanelAnalyticsConfig = z.infer<typeof mixpanelAnalyticsSchema>;

/** Loads the browser SDK before its adjacent initialization snippet. */
export function mixpanelScript() {
  return {
    src: "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js",
  } as const;
}

/** Enables Mixpanel page views for initial loads and History API URL changes. */
export function mixpanelBootstrapScript(): string {
  return `var projectToken=document.currentScript&&document.currentScript.getAttribute("data-mixpanel-project-token");if(projectToken&&window.mixpanel){window.mixpanel.init(projectToken,{track_pageview:"url-with-path"});}`;
}
