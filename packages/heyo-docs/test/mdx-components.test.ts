import { expect, test } from "bun:test";
import { compile } from "@mdx-js/mdx";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  DocumentationCodeBlock,
  documentationMdxComponents,
} from "../src/theme/components/documentation/mdx-components";

function component(name: string) {
  return documentationMdxComponents[name] as ComponentType<
    Record<string, unknown>
  >;
}

test("registers the documentation components for every MDX page", () => {
  expect(Object.keys(documentationMdxComponents)).toEqual(
    expect.arrayContaining([
      "Tabs",
      "Tab",
      "Accordion",
      "AccordionItem",
      "Button",
      "CodeBlock",
      "CodeBlockGroup",
      "Tree",
      "File",
      "Folder",
      "Image",
      "Video",
      "GitHub",
      "Steps",
      "Step",
      "Callout",
      "Columns",
      "Column",
      "Mermaid",
    ]),
  );

  for (const alias of [
    "Callouts",
    "CodeGroup",
    "Codeblock",
    "CodeblockGroup",
    "Danger",
    "Expandable",
    "Github",
    "Info",
    "Note",
    "Tip",
    "Warning",
    "ZoomableImage",
  ]) {
    expect(documentationMdxComponents[alias]).toBeUndefined();
  }

  expect(
    (documentationMdxComponents.GitHub as { Repo?: unknown }).Repo,
  ).toBeUndefined();
});

test("renders left-aligned table headers with gap-4 between columns", () => {
  const Table = component("table");
  const html = renderToStaticMarkup(
    createElement(
      Table,
      null,
      createElement(
        "thead",
        null,
        createElement(
          "tr",
          null,
          createElement("th", null, "Name"),
          createElement("th", null, "Description"),
        ),
      ),
      createElement(
        "tbody",
        null,
        createElement(
          "tr",
          null,
          createElement("td", null, "Table"),
          createElement("td", null, "Content"),
        ),
      ),
    ),
  );

  expect(html).toContain("[&amp;_th]:text-left");
  expect(html).toContain("[&amp;_th]:px-2");
  expect(html).toContain("[&amp;_td]:px-2");
});

test("renders interactive component shells during SSR", () => {
  const Tabs = component("Tabs");
  const Tab = component("Tab");
  const Accordion = component("Accordion");
  const AccordionItem = component("AccordionItem");
  const CodeBlock = component("CodeBlock");
  const CodeBlockGroup = component("CodeBlockGroup");
  const CodeSnippet = component("CodeSnippet");
  const Button = component("Button");
  const Callout = component("Callout");
  const File = component("File");
  const GitHub = component("GitHub");
  const Image = component("Image");
  const Video = component("Video");
  const Mermaid = component("Mermaid");
  const RelatedTopic = component("RelatedTopic");
  const RelatedTopics = component("RelatedTopics");
  const Tree = component("Tree");

  const html = renderToStaticMarkup(
    createElement(
      "main",
      null,
      createElement(
        Tabs,
        { defaultValue: "Bun" },
        createElement(Tab, { title: "Bun", value: "bun" }, "Bun content"),
      ),
      createElement(
        Accordion,
        { multiple: true },
        createElement(
          AccordionItem,
          { title: "Question", value: "question" },
          "Answer",
        ),
      ),
      createElement(
        CodeBlock,
        { language: "ts", title: "Standalone TypeScript" },
        "const standalone = true;",
      ),
      createElement(
        CodeBlock,
        { editable: true, language: "json", title: "Editable JSON" },
        '{ "name": "Ada" }',
      ),
      createElement(
        CodeBlockGroup,
        { defaultValue: "Bun" },
        createElement(
          CodeBlock,
          { language: "ts", title: "TypeScript" },
          "const value = 1;",
        ),
        createElement(
          CodeBlock,
          { language: "bash", title: "Bun" },
          "bun test",
        ),
      ),
      createElement(
        CodeSnippet,
        {
          code: "const preview = true;\nconst one = 1;\nconst two = 2;\nconst three = 3;",
          language: "ts",
        },
        "Preview",
      ),
      createElement(
        Button,
        {
          align: "right",
          href: "https://example.com",
          size: "lg",
          target: "_blank",
          variant: "outline",
        },
        "Read more",
      ),
      createElement(Callout, {
        type: "warning",
        title: "Configuration warning",
        description: "Useful content",
      }),
      createElement(Image, {
        alt: "A local diagram",
        caption: "An explanatory caption",
        src: "/diagram.svg",
      }),
      createElement(Image, {
        alt: "A diagram for each color mode",
        darkSrc: "/diagram-dark.svg",
        lightSrc: "/diagram-light.svg",
        src: "/diagram-fallback.svg",
      }),
      createElement(Video, {
        caption: "A short product tour",
        poster: "/product-tour-poster.png",
        src: "/product-tour.mp4",
      }),
      createElement(File, {
        description: "A printable reference",
        name: "Quick reference",
        src: "/quick-reference.pdf",
      }),
      createElement(
        RelatedTopics,
        null,
        createElement(RelatedTopic, {
          icon: "book",
          name: "Getting started",
          src: "/getting-started",
        }),
      ),
      createElement(
        Tree,
        null,
        createElement(File, { name: "heyo-docs.config.ts" }),
      ),
      createElement(GitHub, { href: "https://github.com/heyo/heyo-docs" }),
      createElement(GitHub, {
        href: "https://github.com/heyo/heyo-docs",
        variant: "inset",
      }),
      createElement(Mermaid, { chart: "flowchart LR\nA-->B" }),
      createElement(Mermaid, {
        chart: "flowchart LR\nA-->B",
        variant: "ascii",
      }),
    ),
  );

  expect(html).toContain("Bun content");
  expect(html).toContain("bun test");
  expect(html).toContain("Question");
  expect(html).toContain('class="shiki');
  expect(html).toContain('data-slot="code-editor"');
  expect(html).toContain('aria-label="Editable json code"');
  expect(html).toContain("max-h-24 overflow-hidden");
  expect(html).toContain("View Code");
  expect(html).toContain('data-slot="mdx-button"');
  expect(html).toContain("justify-end");
  expect(html).toContain('href="https://example.com"');
  expect(html).toContain('rel="noreferrer"');
  expect(html).toContain("h-8 gap-1 px-2.5");
  expect(html).toContain("border-border hover:bg-input/50");
  expect(html).toContain("Useful content");
  expect(html).toContain('data-slot="mdx-image"');
  expect(html).toContain("An explanatory caption");
  expect(html).toContain('src="/diagram-light.svg"');
  expect(html).toContain('src="/diagram-dark.svg"');
  expect(html).not.toContain('src="/diagram-fallback.svg"');
  expect(html).toContain("dark:hidden");
  expect(html).toContain("hidden dark:block");
  expect(html).toContain(
    'class="not-prose my-6 overflow-hidden rounded-md border border-foreground/10 bg-card"',
  );
  expect(html).toContain('class="rounded-md bg-muted/30 p-1.5"');
  expect(html).toContain('data-slot="mdx-video"');
  expect(html).toContain("A short product tour");
  expect(html).toContain('src="/product-tour.mp4"');
  expect(html).toContain('poster="/product-tour-poster.png"');
  expect(html).toContain('controls=""');
  expect(html).toContain('data-slot="mdx-file"');
  expect(html).toContain("Quick reference");
  expect(html).toContain('download=""');
  expect(html).toContain("heyo-docs-code not-prose my-5 w-full");
  expect(html).toContain("not-prose my-5 w-full gap-0");
  expect(html).toContain("not-prose mt-10 w-full");
  expect(html).toContain("not-prose my-5 w-full !list-none");
  expect(html).toContain("Loading repository data");
  expect(html).toContain("!no-underline");
  expect(html).toContain("hover:bg-muted/70");
  expect(html).toContain("px-2.5 pt-3 pb-1");
  expect(html).toContain("flowchart LR");
  expect(html).toContain('data-slot="mermaid"');
  expect(html).toContain("border-dashed");
  expect(html).toContain('data-slot="callout"');
});

test("uses a fenced code block title as its label", () => {
  const html = renderToStaticMarkup(
    createElement(
      DocumentationCodeBlock,
      null,
      createElement(
        "code",
        { className: "language-ts", title: "app/routes/markdown.ts" },
        "export async function loader() {}",
      ),
    ),
  );

  expect(html).toContain(
    '<span class="min-w-0 flex-1 truncate font-mono">app/routes/markdown.ts</span>',
  );
});

test("MDX compiles component syntax used by the documentation theme", async () => {
  const output = String(
    await compile(
      '<Tabs><Tab title="Bun">Content</Tab></Tabs>\n\n<Callout variant="destructive">Danger</Callout>\n\n<GitHub href="https://github.com/heyo/heyo-docs" />',
      {
        outputFormat: "program",
        providerImportSource: undefined,
      },
    ),
  );

  expect(output).toContain(
    "const {Callout, GitHub, Tab, Tabs} = props.components",
  );
});
