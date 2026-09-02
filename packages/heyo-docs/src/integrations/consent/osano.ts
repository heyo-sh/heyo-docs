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

/** Configuration for an Osano cookie-consent script. */
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
