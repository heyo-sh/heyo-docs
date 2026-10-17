---
"@heyo-sh/heyo-docs": patch
---

Keep the line breaks an author writes in a code block. MDX renders the children of a component as markdown, so a blank line arrived as a second paragraph and every newline was dropped when the source text was read back, and a blank line that did survive collapsed to nothing because an empty line span had no height of its own. `CodeBlock`, `CodeBlockGroup`, and `Mermaid` now rebuild the newlines their markup implies, blank lines keep the height of a line in every built-in theme, and unhighlighted code is written with the same line separators Shiki uses.
