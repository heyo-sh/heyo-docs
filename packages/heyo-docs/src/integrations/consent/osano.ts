import { z } from "zod";

const osanoScriptUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "cmp.osano.com" &&
      url.pathname.endsWith("/osano.js")
    );
  }, "Osano scriptUrl must be an HTTPS cmp.osano.com URL ending in /osano.js.");

/**
 * Source of truth: https://docs.osano.com/en-US/osano/article/UT9yXk6U-installing-osano-cookie-consent
 *
 * Osano supplies an osano.js URL for a published consent configuration. It
 * must execute in the document head before third-party scripts it manages.
 */
export const osanoConsentSchema = z
  .object({ scriptUrl: osanoScriptUrlSchema })
  .strict();

export type OsanoConsentConfig = z.infer<typeof osanoConsentSchema>;

/**
 * Osano must be parser-blocking and appear before other third-party scripts so
 * that it can apply its consent policy before analytics or support load.
 */
export function osanoConsentScript(config: OsanoConsentConfig) {
  return { src: config.scriptUrl } as const;
}
