import { Children, type ReactNode } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "../../../lib/utils";
import type { OpenApiDocument } from "../../../types";
import { OpenApiSchemaPopover } from "./schema";

function schemaReference(href: string | undefined): string | undefined {
  return href?.match(/^#\/(?:components\/schemas|definitions)\/[^/]+$/)
    ? href
    : undefined;
}

function schemaReferenceLabel(reference: string): string {
  const name = reference.split("/").at(-1) ?? "Schema";
  try {
    return decodeURIComponent(name).replaceAll("~1", "/").replaceAll("~0", "~");
  } catch {
    return name;
  }
}

function linkLabel(children: ReactNode, reference: string): ReactNode {
  const hasLabel = Children.toArray(children).some(
    (child) => typeof child !== "string" || child.trim().length > 0,
  );
  return hasLabel ? children : schemaReferenceLabel(reference);
}

function withoutApiEndpointLinks(markdown: string): string {
  // `api-endpoint:` is an undocumented source-specific scheme. It is not a
  // navigable URL in this documentation site, so retain its label as text.
  return markdown.replace(/\[([^\]]*)\]\(api-endpoint:[^\s)]+\)/g, "$1");
}

/** Renders the CommonMark and safe HTML allowed in OpenAPI descriptions. */
export function OpenApiDescription({
  children,
  className,
  document,
}: {
  children: string;
  className?: string;
  document?: OpenApiDocument;
}) {
  return (
    <div
      className={cn(
        "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/25 [&_a]:underline-offset-4 [&_a:hover]:decoration-foreground [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8125rem] [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      <Markdown
        components={{
          a: ({ children, href, ...props }) => {
            const reference = schemaReference(href);
            return document && reference ? (
              <OpenApiSchemaPopover
                document={document}
                schema={{ $ref: reference }}
              >
                {linkLabel(children, reference)}
              </OpenApiSchemaPopover>
            ) : (
              <a href={href} {...props}>
                {children}
              </a>
            );
          },
        }}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
      >
        {withoutApiEndpointLinks(children)}
      </Markdown>
    </div>
  );
}
