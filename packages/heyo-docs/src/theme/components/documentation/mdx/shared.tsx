import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../../../../lib/utils";

export interface WithChildren {
  children?: ReactNode;
}

export function ComponentContent({
  children,
  className,
}: WithChildren & { className?: string }) {
  return (
    <div className={cn("heyo-docs-mdx-content", className)}>{children}</div>
  );
}

export function asElements<T>(children: ReactNode) {
  return Children.toArray(children).filter(isValidElement) as ReactElement<T>[];
}

export function valueFrom(label: ReactNode, fallback: string) {
  if (typeof label !== "string") return fallback;
  const normalised = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalised || fallback;
}

/**
 * Resolves an MDX default value to one of the values rendered by a component.
 *
 * MDX authors commonly use a visible label such as `Bun` for `defaultValue`,
 * while generated tab values are normalised to `bun`. An invalid value leaves
 * Base UI with no selected panel, so always fall back to the first item.
 */
export function defaultValueFrom<T extends { value: string }>(
  items: readonly T[],
  defaultValue?: string,
) {
  if (!defaultValue) return items[0]?.value;

  return (
    items.find((item) => item.value === defaultValue)?.value ??
    items.find((item) => item.value === valueFrom(defaultValue, defaultValue))
      ?.value ??
    items[0]?.value
  );
}

/**
 * Elements that stand apart from the text around them. MDX renders the
 * children of a component as markdown, so an authored blank line arrives as a
 * second paragraph rather than as a newline in the text.
 */
const paragraphElements = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "div",
  "dl",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul",
]);

/** Elements that only end their line, the way list items are written. */
const lineElements = new Set(["dd", "dt", "li", "tr"]);

/** A newline the markup implies: one line for `<br />`, two for a block. */
interface TextBreak {
  lines: 1 | 2;
}

function collectText(node: ReactNode, segments: (TextBreak | string)[]) {
  if (typeof node === "string" || typeof node === "number") {
    segments.push(String(node));
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) collectText(child, segments);
    return;
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) return;

  const tag = typeof node.type === "string" ? node.type : undefined;
  if (tag === "br") {
    segments.push({ lines: 1 });
    return;
  }

  const lines =
    tag === undefined
      ? undefined
      : paragraphElements.has(tag)
        ? 2
        : lineElements.has(tag)
          ? 1
          : undefined;

  if (lines) segments.push({ lines });
  collectText(node.props.children, segments);
  if (lines) segments.push({ lines });
}

/** Counted by hand: an anchored `\n*` match backtracks over long input. */
function trailingNewlines(text: string, limit: number) {
  let count = 0;
  while (count < limit && text.at(-1 - count) === "\n") count += 1;
  return count;
}

function leadingNewlines(text: string, limit: number) {
  let count = 0;
  while (count < limit && text[count] === "\n") count += 1;
  return count;
}

/**
 * Reads the source text an author wrote inside a component.
 *
 * Code and diagrams are whitespace-sensitive, so the line breaks implied by
 * the markup are restored instead of being dropped: a `<br />` is one newline
 * and a block boundary is a blank line. Breaks are only ever inserted between
 * two pieces of text, so a block never gains a leading or trailing blank line,
 * and newlines already present in the text are counted towards the break.
 */
export function textFromNode(node: ReactNode): string {
  const segments: (TextBreak | string)[] = [];
  collectText(node, segments);

  let text = "";
  let pendingLines = 0;

  for (const segment of segments) {
    if (typeof segment !== "string") {
      if (text !== "") pendingLines = Math.max(pendingLines, segment.lines);
      continue;
    }
    if (segment === "") continue;

    if (pendingLines > 0) {
      const present =
        trailingNewlines(text, pendingLines) +
        leadingNewlines(segment, pendingLines);
      text += "\n".repeat(Math.max(0, pendingLines - present));
      pendingLines = 0;
    }
    text += segment;
  }

  return text;
}
