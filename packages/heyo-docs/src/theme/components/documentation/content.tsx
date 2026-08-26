import type { DocsPage, MdxComponents } from "../../../types";
import { markdownPathname } from "../../../llm";
import { CopyForLlm } from "../actions/copy-for-llm";
import { Open } from "../actions/open";
import {
  DocumentationCodeBlock,
  documentationMdxComponents,
} from "./mdx-components";

interface DocumentationContentProps {
  page: DocsPage;
  mdxComponents?: MdxComponents;
  /** Shows the Markdown and AI actions displayed on regular documentation pages. */
  showActions?: boolean;
}

/** Shared typography for ordinary MDX content and changelog update bodies. */
export const documentationContentClassName =
  "min-w-0 text-[0.9375rem] leading-7 text-foreground/85 [&_a:not([data-slot=button])]:font-medium [&_a:not([data-slot=button])]:text-foreground [&_a:not([data-slot=button])]:underline [&_a:not([data-slot=button])]:decoration-foreground/25 [&_a:not([data-slot=button])]:underline-offset-4 [&_a:not([data-slot=button])]:transition-colors [&_a:not([data-slot=button]):hover]:decoration-foreground [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-foreground/15 [&_blockquote]:pl-5 [&_blockquote]:text-muted-foreground [&_code:not(pre_code)]:rounded-md [&_code:not(pre_code)]:bg-muted [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:font-mono [&_code:not(pre_code)]:text-[0.8125rem] [&_h2]:mt-12 [&_h2]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-9 [&_h3]:scroll-mt-20 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight [&_li]:my-1 [&_li]:pl-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_strong]:font-semibold [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6";

function DocumentTitle() {
  return null;
}

export function DocumentationContent({
  page,
  mdxComponents,
  showActions = true,
}: DocumentationContentProps) {
  const Content = page.content;
  const markdownUrl = markdownPathname(page.slug);

  return (
    <article className={`max-w-3xl ${documentationContentClassName}`}>
      <header className="border-b border-foreground/[0.06] pb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-[2.625rem]">
            {page.title}
          </h1>
          {showActions ? (
            <div className="flex shrink-0 items-center gap-2">
              <CopyForLlm markdownUrl={markdownUrl} />
              <Open markdownUrl={markdownUrl} />
            </div>
          ) : null}
        </div>
        {page.description ? (
          <p className="mb-0 mt-4 max-w-2xl text-[1.0625rem] leading-7 text-muted-foreground">
            {page.description}
          </p>
        ) : null}
      </header>
      <Content
        components={{
          ...documentationMdxComponents,
          ...mdxComponents,
          h1: DocumentTitle as never,
          pre: DocumentationCodeBlock as never,
        }}
      />
    </article>
  );
}
