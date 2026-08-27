import { z } from "zod";
import type { ReactNode } from "react";

import { builtInThemeNames } from "./theme/names";
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
  };
}

export function heyoDocs(config: UserHeyoDocsConfig): HeyoDocsConfig {
  return validateConfig(config);
}
