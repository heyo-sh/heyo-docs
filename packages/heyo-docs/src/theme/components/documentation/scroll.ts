export const documentationScrollAreaId = "heyo-docs-content-scroll-area";

/** Returns the viewport that scrolls the active documentation page. */
export function getDocumentationScrollViewport() {
  return document.querySelector<HTMLElement>(
    `#${documentationScrollAreaId} [data-slot="scroll-area-viewport"]`,
  );
}

/** Returns the active documentation page to the top without moving its sidebar. */
export function scrollDocumentationToTop() {
  const scrollViewport = getDocumentationScrollViewport();
  if (scrollViewport) {
    scrollViewport.scrollTop = 0;
    return;
  }

  window.scrollTo(0, 0);
}
