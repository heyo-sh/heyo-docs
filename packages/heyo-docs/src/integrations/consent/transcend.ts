import { z } from "zod";

const transcendBundleIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(256)
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Transcend bundleId may only contain letters, numbers, underscores, and hyphens.",
  );

/**
 * Source of truth: https://docs.transcend.io/docs/articles/consent-management/configuration/installing-airgap/installing-airgap-js
 *
 * Transcend recommends loading `airgap.js` synchronously as the first script
 * in the document head. It then regulates the analytics and support scripts
 * that follow it; the bundle ID is a public path segment from its dashboard.
 */
export const transcendConsentSchema = z
  .object({ bundleId: transcendBundleIdSchema })
  .strict();

export type TranscendConsentConfig = z.infer<typeof transcendConsentSchema>;

/** Produces Transcend's synchronous production airgap script attributes. */
export function transcendConsentScript(config: TranscendConsentConfig) {
  return {
    dataCfasync: "false",
    src: `https://transcend-cdn.com/cm/${config.bundleId}/airgap.js`,
  } as const;
}

/**
 * Sets the denied Google Consent Mode defaults required before `airgap.js`.
 *
 * This is emitted only by templates that configure both Transcend and a
 * Google tag. It intentionally contains no user-supplied values.
 */
export function transcendGoogleConsentModeDefaultsScript(): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments);}gtag("set","developer_id.dODQ2Mj",true);gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",functionality_storage:"denied",personalization_storage:"denied",security_storage:"denied"});`;
}
