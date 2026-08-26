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

export function textFromNode(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return textFromNode(node.props.children);
  return "";
}
