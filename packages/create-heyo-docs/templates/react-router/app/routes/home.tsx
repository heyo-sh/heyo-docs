import { createDocsModel } from "@heyo-sh/heyo-docs/model";
import { navigationPages } from "@heyo-sh/heyo-docs/navigation";
import { redirect } from "react-router";

import { config } from "virtual:heyo-docs-config";
import { pages } from "virtual:heyo-docs-content";

export function loader() {
  const firstPage = createDocsModel(config, pages)
    .navigation.flatMap((group) => navigationPages(group.sections))
    .at(0);

  if (!firstPage)
    throw new Response("No local documentation page is configured.", {
      status: 404,
    });

  // `content/index.mdx` is a valid minimal starter. Redirecting `/` to `/`
  // creates an infinite prerender redirect on Workers, so render DocsRoute in
  // place when the first document owns the root path.
  if (firstPage.slug === "/") return {};
  return redirect(firstPage.slug);
}

export { default, ErrorBoundary } from "./docs";
