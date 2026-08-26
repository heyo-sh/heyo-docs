import { changelogEntriesFromMdx } from "./content";
import { changelogGroupForPage } from "./navigation";
import type { HeyoDocsConfig, MarkdownPage } from "./types";

interface RssItem {
  title: string;
  link: string;
  description: string;
  tags: string[];
  publishedAt?: string;
}

/**
 * Builds RSS entries from the MDX pages selected by changelog groups. Pages
 * outside a changelog group are deliberately excluded from the feed.
 */
export function rssItems(
  pages: MarkdownPage[],
  config: Pick<HeyoDocsConfig, "groups">,
  siteUrl: string,
): RssItem[] {
  const baseUrl = siteUrl.replace(/\/$/, "");

  return pages.flatMap((page) => {
    if (!changelogGroupForPage(config.groups, page, pages)) return [];

    return changelogEntriesFromMdx(page.raw).map((entry) => ({
      title: entry.label,
      link: `${baseUrl}${page.slug === "/" ? "/" : page.slug}#${entry.id}`,
      description: entry.description,
      tags: entry.tags,
      publishedAt: rssDate(entry.date),
    }));
  });
}

/**
 * Generates an RSS 2.0 changelog feed. `siteUrl` is supplied by the route so
 * previews without a configured `siteUrl` can use the current request origin.
 */
export function rssXml(
  pages: MarkdownPage[],
  config: Pick<HeyoDocsConfig, "title" | "description" | "groups">,
  siteUrl: string,
): string {
  const baseUrl = siteUrl.replace(/\/$/, "");
  const items = rssItems(pages, config, baseUrl);
  const latestPublishedAt = items
    .map((item) => item.publishedAt)
    .find((publishedAt): publishedAt is string => Boolean(publishedAt));
  const serializedItems = items
    .map((item) => {
      const categories = item.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");
      return [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(item.link)}</link>`,
        `      <guid isPermaLink=\"true\">${escapeXml(item.link)}</guid>`,
        ...(item.description
          ? [`      <description>${escapeXml(item.description)}</description>`]
          : []),
        ...(item.publishedAt
          ? [`      <pubDate>${item.publishedAt}</pubDate>`]
          : []),
        ...(categories ? [categories] : []),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${config.title} updates`)}</title>`,
    `    <link>${escapeXml(baseUrl)}</link>`,
    `    <description>${escapeXml(config.description)}</description>`,
    `    <atom:link href="${escapeXml(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    ...(latestPublishedAt
      ? [`    <lastBuildDate>${latestPublishedAt}</lastBuildDate>`]
      : []),
    ...(serializedItems ? [serializedItems] : []),
    "  </channel>",
    "</rss>",
  ].join("\n");
}

function rssDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toUTCString();
}

function escapeXml(value: string): string {
  return value.replace(
    /[<>&'\"]/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[character]!,
  );
}
