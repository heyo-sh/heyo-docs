import { z } from "zod";
import type { ReactNode } from "react";

import { builtInThemeNames } from "./theme/names";
import { adobeAnalyticsSchema } from "./integrations/analytics/adobe";
import { amplitudeAnalyticsSchema } from "./integrations/analytics/amplitude";
import { clarityAnalyticsSchema } from "./integrations/analytics/clarity";
import { clearbitAnalyticsSchema } from "./integrations/analytics/clearbit";
import { fathomAnalyticsSchema } from "./integrations/analytics/fathom";
import { googleAnalyticsSchema } from "./integrations/analytics/google-analytics";
import { googleTagManagerSchema } from "./integrations/analytics/google-tag-manager";
import { heapAnalyticsSchema } from "./integrations/analytics/heap";
import { hotjarAnalyticsSchema } from "./integrations/analytics/hotjar";
import { logRocketAnalyticsSchema } from "./integrations/analytics/logrocket";
import { mixpanelAnalyticsSchema } from "./integrations/analytics/mixpanel";
import { openpanelAnalyticsSchema } from "./integrations/analytics/openpanel";
import { openReplayAnalyticsSchema } from "./integrations/analytics/openreplay";
import { osanoConsentSchema } from "./integrations/consent/osano";
import { transcendConsentSchema } from "./integrations/consent/transcend";
import { pirschAnalyticsSchema } from "./integrations/analytics/pirsch";
import { plausibleAnalyticsSchema } from "./integrations/analytics/plausible";
import { posthogAnalyticsSchema } from "./integrations/analytics/posthog";
import { rybbitAnalyticsSchema } from "./integrations/analytics/rybbit";
import { swetrixAnalyticsSchema } from "./integrations/analytics/swetrix";
import { chaskiqSupportSchema } from "./integrations/support/chaskiq";
import { chatwootSupportSchema } from "./integrations/support/chatwoot";
import { frontSupportSchema } from "./integrations/support/front";
import { intercomSupportSchema } from "./integrations/support/intercom";
import { papercupsSupportSchema } from "./integrations/support/papercups";
import { typebotSupportSchema } from "./integrations/support/typebot";
import { zammadSupportSchema } from "./integrations/support/zammad";
import { umamiAnalyticsSchema } from "./integrations/analytics/umami";
import type {
  DocumentationSection,
  HeyoDocsConfig,
  UserHeyoDocsConfig,
} from "./types";

const nonEmptyString = z.string().trim().min(1);

const siteUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.search === "" &&
      url.hash === ""
    );
  }, "siteUrl must be an HTTP(S) base URL without a query string or fragment.");

const pageReferenceSchema = nonEmptyString.refine((reference) => {
  const normalised = reference
    .replaceAll("\\", "/")
    .replace(/^\.?\//, "")
    .replace(/\/+$/, "");
  return !normalised.split("/").includes("..");
}, "Page references must stay inside the content directory.");

const pageLinkSchema = z
  .object({
    title: nonEmptyString,
    src: nonEmptyString,
    icon: nonEmptyString.optional(),
  })
  .strict();

const pageReferenceWithIconSchema = z
  .object({
    page: pageReferenceSchema,
    icon: nonEmptyString,
  })
  .strict();

const documentationSectionSchema: z.ZodType<DocumentationSection> = z.lazy(() =>
  z
    .object({
      section: nonEmptyString.optional(),
      icon: nonEmptyString.optional(),
      expanded: z.boolean().default(true),
      pages: z
        .array(
          z.union([
            pageReferenceSchema,
            pageLinkSchema,
            pageReferenceWithIconSchema,
            documentationSectionSchema,
          ]),
        )
        .optional(),
    })
    .strict()
    .refine(
      (section) => section.section !== undefined || section.pages !== undefined,
      "A documentation section must define `section` or `pages`.",
    )
    .transform(({ pages, ...section }) => ({ ...section, pages: pages ?? [] })),
);

const openApiSectionSchema = z.object({ schema: nonEmptyString }).strict();

const docsSectionSchema = z.union([
  documentationSectionSchema,
  openApiSectionSchema,
]);

const documentationGroupSchema = z
  .object({
    type: z.literal("documentation").optional(),
    group: nonEmptyString,
    icon: nonEmptyString.optional(),
    public: z.boolean().default(true),
    sections: z.array(docsSectionSchema).default([]),
  })
  .strict()
  .transform((group) => ({ ...group, type: "documentation" as const }));

const changelogGroupSchema = z
  .object({
    type: z.literal("changelog"),
    group: nonEmptyString,
    description: nonEmptyString.optional(),
    icon: nonEmptyString.optional(),
    public: z.boolean().default(true),
    updates: z.array(pageReferenceSchema).min(1),
  })
  .strict();

const configSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "A documentation title cannot be empty.")
      .default("Heyo Documentation"),
    description: z
      .string()
      .trim()
      .default("Clear, focused documentation for your project."),
    theme: z.enum(builtInThemeNames).default("grain"),
    colors: z
      .object({
        primary: nonEmptyString.optional(),
        secondary: nonEmptyString.optional(),
      })
      .strict()
      .default({}),
    // JSX is runtime-only UI. Adapters that emit JSON must omit it from their
    // generated data and use the application's original configuration.
    navigation: z.custom<ReactNode>().optional(),
    groups: z
      .array(z.union([documentationGroupSchema, changelogGroupSchema]))
      .default([]),
    footer: z
      .object({
        github: z.string().url().optional(),
        website: z.string().url().optional(),
      })
      .strict()
      .default({}),
    mode: z.enum(["system", "light", "dark"]).default("system"),
    content: z.string().trim().min(1, "A content directory must be provided."),
    branding: z
      .object({
        name: z.string().trim().min(1).optional(),
        logo: z.string().trim().min(1).optional(),
      })
      .strict()
      .default({}),
    siteUrl: siteUrlSchema.optional(),
    integrations: z
      .object({
        analytics: z
          .object({
            adobe: adobeAnalyticsSchema.optional(),
            amplitude: amplitudeAnalyticsSchema.optional(),
            clarity: clarityAnalyticsSchema.optional(),
            clearbit: clearbitAnalyticsSchema.optional(),
            fathom: fathomAnalyticsSchema.optional(),
            ga4: googleAnalyticsSchema.optional(),
            gtm: googleTagManagerSchema.optional(),
            heap: heapAnalyticsSchema.optional(),
            hotjar: hotjarAnalyticsSchema.optional(),
            logrocket: logRocketAnalyticsSchema.optional(),
            mixpanel: mixpanelAnalyticsSchema.optional(),
            openpanel: openpanelAnalyticsSchema.optional(),
            openreplay: openReplayAnalyticsSchema.optional(),
            pirsch: pirschAnalyticsSchema.optional(),
            plausible: plausibleAnalyticsSchema.optional(),
            posthog: posthogAnalyticsSchema.optional(),
            rybbit: rybbitAnalyticsSchema.optional(),
            swetrix: swetrixAnalyticsSchema.optional(),
            umami: umamiAnalyticsSchema.optional(),
          })
          .strict()
          .default({}),
        support: z
          .object({
            chaskiq: chaskiqSupportSchema.optional(),
            chatwoot: chatwootSupportSchema.optional(),
            front: frontSupportSchema.optional(),
            intercom: intercomSupportSchema.optional(),
            papercups: papercupsSupportSchema.optional(),
            typebot: typebotSupportSchema.optional(),
            zammad: zammadSupportSchema.optional(),
          })
          .strict()
          .default({}),
        consent: z
          .object({
            osano: osanoConsentSchema.optional(),
            transcend: transcendConsentSchema.optional(),
          })
          .strict()
          .refine(
            (integrations) =>
              Object.values(integrations).filter((integration) => integration)
                .length <= 1,
            "Only one consent manager may be configured at a time.",
          )
          .default({}),
      })
      .strict()
      .default({ analytics: {}, support: {}, consent: {} }),
  })
  .strict();

export function validateConfig(config: UserHeyoDocsConfig): HeyoDocsConfig {
  const parsed = configSchema.parse(config);
  return {
    title: parsed.title,
    description: parsed.description,
    theme: parsed.theme,
    colors: parsed.colors,
    navigation: parsed.navigation,
    groups: parsed.groups,
    footer: parsed.footer,
    mode: parsed.mode,
    content: parsed.content,
    branding: {
      name: parsed.branding.name ?? parsed.title,
      logo: parsed.branding.logo,
    },
    siteUrl: parsed.siteUrl?.replace(/\/$/, ""),
    integrations: parsed.integrations,
  };
}

export function heyoDocs(config: UserHeyoDocsConfig): HeyoDocsConfig {
  return validateConfig(config);
}
