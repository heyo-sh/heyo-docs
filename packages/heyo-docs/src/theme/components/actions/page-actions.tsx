import { useEffect, useMemo, useState } from "react";

import {
  markdownPathname,
  markdownPathnameAtCurrentPage,
  markdownPathnameAtSite,
} from "../../../llm";
import type { PageActionsConfig } from "../../../types";
import { CopyForLlm } from "./copy-for-llm";
import { Open } from "./open";

function useMarkdownUrl(pagePathname: string, siteUrl: string | undefined) {
  const fallback = useMemo(
    () =>
      siteUrl
        ? markdownPathnameAtSite(siteUrl, pagePathname)
        : markdownPathname(pagePathname),
    [pagePathname, siteUrl],
  );
  const [markdownUrl, setMarkdownUrl] = useState(fallback);

  useEffect(() => {
    setMarkdownUrl(
      markdownPathnameAtCurrentPage(window.location.pathname, pagePathname),
    );
  }, [pagePathname]);

  return markdownUrl;
}

/** Page-level Markdown and AI actions, resolved from the public browser URL. */
export function PageActions({
  actions,
  pagePathname,
}: {
  actions: PageActionsConfig;
  pagePathname: string;
}) {
  const markdownUrl = useMarkdownUrl(pagePathname, actions.siteUrl);

  if (!actions.copyForLLM && !actions.openIn) return null;

  return (
    <>
      {actions.copyForLLM ? <CopyForLlm markdownUrl={markdownUrl} /> : null}
      {actions.openIn ? <Open markdownUrl={markdownUrl} /> : null}
    </>
  );
}
