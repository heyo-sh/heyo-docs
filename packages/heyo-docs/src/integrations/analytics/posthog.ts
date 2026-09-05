import { z } from "zod";

const posthogApiHostSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.pathname === "" || url.pathname === "/") &&
      url.search === "" &&
      url.hash === ""
    );
  }, "PostHog apiHost must be an HTTPS origin without a path, query, or fragment.");

const posthogProjectApiKeySchema = z
  .string()
  .trim()
  .regex(
    /^phc_[A-Za-z0-9]+$/,
    "PostHog projectApiKey must be a public key beginning with phc_.",
  );

/**
 * Source of truth: https://posthog.com/docs/libraries/js/config
 *
 * PostHog initializes from its browser script with a public project key. The
 * explicit `capture_pageview: "history_change"` option makes the SDK observe
 * SPA path changes without a framework route callback. External PostHog
 * scripts are injected in the document head to avoid React SSR hydration
 * mismatches.
 */
export const posthogAnalyticsSchema = z
  .object({
    projectApiKey: posthogProjectApiKeySchema,
    apiHost: posthogApiHostSchema.optional(),
  })
  .strict();

export type PosthogAnalyticsConfig = z.infer<typeof posthogAnalyticsSchema>;

const defaultPosthogApiHost = "https://us.i.posthog.com";

/** Loads PostHog from the configured cloud or self-hosted HTTPS origin. */
export function posthogScript(config: PosthogAnalyticsConfig) {
  const apiHost = config.apiHost ?? defaultPosthogApiHost;
  return { src: new URL("/static/array.js", apiHost).href } as const;
}

/** Initializes PostHog and opts into its History API page-view capture mode. */
export function posthogBootstrapScript(): string {
  return `var s=document.currentScript;var projectApiKey=s&&s.getAttribute("data-posthog-project-api-key");var apiHost=s&&s.getAttribute("data-posthog-api-host");if(projectApiKey&&apiHost&&window.posthog){window.posthog.init(projectApiKey,{api_host:apiHost,capture_pageview:"history_change",external_scripts_inject_target:"head"});}`;
}

/** Resolves the documented default only at the framework boundary. */
export function posthogApiHost(config: PosthogAnalyticsConfig): string {
  return config.apiHost ?? defaultPosthogApiHost;
}
