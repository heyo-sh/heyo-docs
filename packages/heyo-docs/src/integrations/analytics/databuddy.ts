import { z } from "zod";

const databuddyClientIdSchema = z.string().trim().min(1).max(256);
const databuddyScriptUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.pathname.endsWith(".js") &&
      url.search === "" &&
      url.hash === ""
    );
  }, "Databuddy scriptUrl must be an HTTPS JavaScript URL without a query or fragment.");
const databuddyApiUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.search === "" &&
      url.hash === "" &&
      !value.endsWith("/")
    );
  }, "Databuddy apiUrl must be an HTTPS URL without a trailing slash, query, or fragment.");
const databuddyPathPatternsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(256)
      .refine(
        (value) => value.startsWith("/"),
        "Databuddy path patterns are matched against location.pathname and must start with a slash.",
      ),
  )
  .min(1)
  .max(64);

/**
 * Source of truth: https://www.databuddy.cc/docs/sdk/vanilla-js
 *
 * Databuddy's CDN tracker reads every `data-*` attribute of its own script
 * tag, so the browser bundle needs no npm SDK: `@databuddy/sdk`'s React
 * component only injects this same script with the same attributes. The
 * tracker tracks client-side navigation on its own through the Navigation API,
 * with a `popstate` and `location.href` fallback, so SPA routers need no
 * framework-specific callback. Only the public client ID is required; every
 * tracking option is opt-in and defaults to Databuddy's documented behavior.
 *
 * Numbers are restricted to integers except `samplingRate`, because the
 * tracker coerces `^\d+$` attribute values to numbers and keeps every other
 * value as a string. Path patterns are matched against `location.pathname`.
 */
export const databuddyAnalyticsSchema = z
  .object({
    clientId: databuddyClientIdSchema,
    scriptUrl: databuddyScriptUrlSchema.optional(),
    apiUrl: databuddyApiUrlSchema.optional(),
    trackWebVitals: z.boolean().optional(),
    trackErrors: z.boolean().optional(),
    trackOutgoingLinks: z.boolean().optional(),
    trackInteractions: z.boolean().optional(),
    trackAttributes: z.boolean().optional(),
    trackHashChanges: z.boolean().optional(),
    enableBatching: z.boolean().optional(),
    batchSize: z.number().int().min(1).max(50).optional(),
    batchTimeout: z.number().int().min(1).max(60_000).optional(),
    samplingRate: z.number().min(0).max(1).optional(),
    skipPatterns: databuddyPathPatternsSchema.optional(),
    maskPatterns: databuddyPathPatternsSchema.optional(),
    disabled: z.boolean().optional(),
  })
  .strict();

export type DatabuddyAnalyticsConfig = z.infer<typeof databuddyAnalyticsSchema>;

const defaultDatabuddyScriptUrl = "https://cdn.databuddy.cc/databuddy.js";

/** Serializes a documented flag exactly like Databuddy's own script injector. */
function databuddyFlagAttribute(value: boolean | undefined) {
  return value === undefined ? undefined : String(value);
}

/** Serializes a documented numeric option, keeping unset options unrendered. */
function databuddyNumberAttribute(value: number | undefined) {
  return value === undefined ? undefined : String(value);
}

/** Serializes path patterns as the JSON array the tracker parses. */
function databuddyPatternAttribute(value: readonly string[] | undefined) {
  return value === undefined ? undefined : JSON.stringify(value);
}

/**
 * Produces Databuddy's asynchronous, SPA-aware tracker-script attributes.
 * Unset options are omitted so the tracker keeps its documented defaults.
 */
export function databuddyAnalyticsScript(config: DatabuddyAnalyticsConfig) {
  return {
    async: true,
    crossOrigin: "anonymous",
    src: config.scriptUrl ?? defaultDatabuddyScriptUrl,
    clientId: config.clientId,
    apiUrl: config.apiUrl,
    trackWebVitals: databuddyFlagAttribute(config.trackWebVitals),
    trackErrors: databuddyFlagAttribute(config.trackErrors),
    trackOutgoingLinks: databuddyFlagAttribute(config.trackOutgoingLinks),
    trackInteractions: databuddyFlagAttribute(config.trackInteractions),
    trackAttributes: databuddyFlagAttribute(config.trackAttributes),
    trackHashChanges: databuddyFlagAttribute(config.trackHashChanges),
    enableBatching: databuddyFlagAttribute(config.enableBatching),
    batchSize: databuddyNumberAttribute(config.batchSize),
    batchTimeout: databuddyNumberAttribute(config.batchTimeout),
    samplingRate: databuddyNumberAttribute(config.samplingRate),
    skipPatterns: databuddyPatternAttribute(config.skipPatterns),
    maskPatterns: databuddyPatternAttribute(config.maskPatterns),
    disabled: databuddyFlagAttribute(config.disabled),
  } as const;
}
