import { docsSeo, siteSeo, type DocsSeoInput } from "./index";
import { absoluteUrlAtBasePath } from "../lib/url";
import type { HeyoDocsConfig } from "../types";

/** Structural subset accepted by Next App Router's `Metadata` type. */
export interface NextSeoMetadata {
  title: string;
  description: string;
  robots: { index: boolean; follow: boolean };
  referrer?: "strict-origin-when-cross-origin";
  alternates?: { canonical?: string };
  openGraph: {
    type: "article" | "website";
    siteName: string;
    title: string;
    description: string;
    url?: string;
  };
  twitter: { card: "summary"; title: string; description: string };
}

/** Converts automatic site metadata to Next App Router metadata. */
export function nextSiteSeo(config: HeyoDocsConfig): {
  metadata: NextSeoMetadata & {
    metadataBase?: URL;
    alternates?: {
      canonical?: string;
      types?: { "application/rss+xml": string };
    };
  };
  structuredData: unknown[];
} {
  const seo = siteSeo(config);
  return {
    metadata: {
      title: seo.title,
      description: seo.description,
      robots: { index: true, follow: true },
      referrer: "strict-origin-when-cross-origin",
      ...(config.siteUrl ? { metadataBase: new URL(config.siteUrl) } : {}),
      alternates: {
        ...(seo.canonical ? { canonical: seo.canonical } : {}),
        ...(config.groups.some((group) => group.type === "changelog")
          ? {
              types: {
                "application/rss+xml": config.siteUrl
                  ? absoluteUrlAtBasePath(config.siteUrl, "/rss.xml")
                  : "/rss.xml",
              },
            }
          : {}),
      },
      openGraph: {
        type: "website",
        siteName: config.title,
        title: seo.title,
        description: seo.description,
        ...(config.siteUrl ? { url: config.siteUrl } : {}),
      },
      twitter: {
        card: "summary",
        title: seo.title,
        description: seo.description,
      },
    },
    structuredData: seo.structuredData,
  };
}

/** Converts automatic docs-page metadata to Next App Router metadata. */
export function nextDocsSeo(input: DocsSeoInput): {
  metadata: NextSeoMetadata;
  structuredData: unknown[];
} {
  const { title, description, canonical, structuredData } = docsSeo(input);
  return {
    metadata: {
      title,
      description,
      robots: { index: true, follow: true },
      alternates: canonical ? { canonical } : undefined,
      openGraph: {
        type: "article",
        siteName: input.config.title,
        title,
        description,
        ...(canonical ? { url: canonical } : {}),
      },
      twitter: { card: "summary", title, description },
    },
    structuredData,
  };
}
