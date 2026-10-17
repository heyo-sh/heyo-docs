const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "'": "&#39;",
  '"': "&quot;",
  "<": "&lt;",
  ">": "&gt;",
};

/**
 * Renders unhighlighted code in Shiki's markup so both paths look and behave
 * the same. Lines keep the real newline Shiki writes between its spans, which
 * is what the text of a selection or `textContent` is built from, and blank
 * lines keep their own empty span so the stylesheet can hold their height.
 */
export function plainCodeHtml(source: string) {
  return `<pre class="shiki"><code>${source
    .split("\n")
    .map(
      (line) =>
        `<span class="line">${line.replace(
          /[&<>"']/g,
          (character) => htmlEntities[character]!,
        )}</span>`,
    )
    .join("\n")}</code></pre>`;
}
