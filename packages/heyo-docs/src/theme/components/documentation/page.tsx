import type { DocsPageProps } from "../../../types";
import { PageNavigation } from "../actions/navigation";
import { DocumentationContent } from "./content";

export function DocumentationPage({
  mdxComponents,
  next,
  page,
  previous,
  tableOfContents,
}: DocsPageProps) {
  return (
    <div className="min-w-0">
      <div className="grid gap-y-10 xl:items-start xl:grid-cols-[minmax(0,46rem)_minmax(13rem,17rem)] xl:gap-x-16 xl:gap-y-0">
        <div className="min-w-0 max-w-[46rem]">
          <DocumentationContent mdxComponents={mdxComponents} page={page} />
          <PageNavigation next={next} previous={previous} />
        </div>
        {tableOfContents}
      </div>
    </div>
  );
}
