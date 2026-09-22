"use client";

import { useLayoutEffect, useRef } from "react";

import { scrollDocumentationToTop } from "./scroll";

/**
 * Resets the content viewport after a client-side documentation route commits.
 * The sidebar lives outside that viewport, so its scroll position is retained.
 */
export function DocumentationScrollReset({ pathname }: { pathname: string }) {
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    scrollDocumentationToTop();
  }, [pathname]);

  return null;
}
