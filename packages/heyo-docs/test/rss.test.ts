import { expect, test } from "bun:test";

import { heyoDocs } from "../src/config";
import { rssItems, rssXml } from "../src/rss";
import type { MarkdownPage } from "../src/types";

const config = heyoDocs({
  content: "./content",
  title: "Acme & Co.",
  description: "Updates for <Acme>.",
  groups: [
    {
      group: "Changelog",
      type: "changelog",
      updates: ["changelog"],
    },
  ],
});

const pages: MarkdownPage[] = [
  {
    slug: "/changelog",
    sourcePath: "changelog.mdx",
    title: "Changelog",
    description: "Product updates.",
    raw: `<Update label="March & April" date="2026-03-01" tags={["New & notable"]}>
## Highlights

Added RSS support.
</Update>`,
  },
  {
    slug: "/guide",
    sourcePath: "guide.mdx",
    title: "Guide",
    description: "A guide.",
    raw: `<Update label="Not a release">This is not part of the feed.</Update>`,
  },
];

test("builds RSS items only from configured changelog pages", () => {
  expect(rssItems(pages, config, "https://docs.example.com/")).toEqual([
    {
      title: "March & April",
      link: "https://docs.example.com/changelog#march-april",
      description: "Highlights Added RSS support.",
      tags: ["New & notable"],
      publishedAt: "Sun, 01 Mar 2026 00:00:00 GMT",
    },
  ]);
});

test("serializes a discoverable, escaped RSS 2.0 document", () => {
  const feed = rssXml(pages, config, "https://docs.example.com/");

  expect(feed).toContain(
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
  );
  expect(feed).toContain("<title>Acme &amp; Co. updates</title>");
  expect(feed).toContain(
    "<description>Updates for &lt;Acme&gt;.</description>",
  );
  expect(feed).toContain('href="https://docs.example.com/rss.xml"');
  expect(feed).toContain("<title>March &amp; April</title>");
  expect(feed).toContain("<category>New &amp; notable</category>");
  expect(feed).toContain("<pubDate>Sun, 01 Mar 2026 00:00:00 GMT</pubDate>");
});
