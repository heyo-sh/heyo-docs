import { createDocsModel, navigationPages } from "@heyo-sh/heyo-docs";
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

  return redirect(firstPage.slug);
}

export { default, ErrorBoundary } from "./docs";
