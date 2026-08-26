import type { HeyoDocsConfig, SeoData } from "./types";

export function seoForPage(
  config: HeyoDocsConfig,
  page: Pick<SeoData, "title" | "description"> & { slug: string },
): SeoData {
  return {
    title: `${page.title} | ${config.title}`,
    description: page.description || config.description,
    canonical: config.siteUrl
      ? `${config.siteUrl}${page.slug === "/" ? "/" : page.slug}`
      : undefined,
  };
}

export function sitemapXml(siteUrl: string, paths: string[]): string {
  const base = siteUrl.replace(/\/$/, "");
  const urls = paths
    .map(
      (path) =>
        `  <url><loc>${escapeXml(`${base}${path === "/" ? "/" : path}`)}</loc></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
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
