export const documentationScrollAreaId = "heyo-docs-content-scroll-area";

/** Returns the viewport that scrolls the active documentation page. */
export function getDocumentationScrollViewport() {
  return document.querySelector<HTMLElement>(
    `#${documentationScrollAreaId} [data-slot="scroll-area-viewport"]`,
  );
}
