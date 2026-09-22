import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "shiki/dist/langs/bash.mjs";
import html from "shiki/dist/langs/html.mjs";
import javascript from "shiki/dist/langs/javascript.mjs";
import json from "shiki/dist/langs/json.mjs";
import jsx from "shiki/dist/langs/jsx.mjs";
import markdown from "shiki/dist/langs/markdown.mjs";
import python from "shiki/dist/langs/python.mjs";
import tsx from "shiki/dist/langs/tsx.mjs";
import typescript from "shiki/dist/langs/typescript.mjs";
import yaml from "shiki/dist/langs/yaml.mjs";
import githubDark from "shiki/dist/themes/github-dark.mjs";
import githubLight from "shiki/dist/themes/github-light.mjs";

const shiki = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  langs: [
    bash,
    html,
    javascript,
    json,
    jsx,
    markdown,
    python,
    tsx,
    typescript,
    yaml,
  ],
  themes: [githubDark, githubLight],
});

const languageAliases: Record<string, string> = {
  html: "html",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  markdown: "markdown",
  md: "markdown",
  py: "python",
  python: "python",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  tsx: "tsx",
  typescript: "typescript",
  xml: "html",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
};

export function highlightCode(source: string, language: string): string {
  const resolvedLanguage = languageAliases[language.toLowerCase()];
  if (!resolvedLanguage) return plainCodeHtml(source);
  try {
    return shiki.codeToHtml(source, {
      lang: resolvedLanguage,
      themes: { dark: "github-dark", light: "github-light" },
    });
  } catch {
    return plainCodeHtml(source);
  }
}

function plainCodeHtml(source: string) {
  return `<pre class="shiki"><code>${source
    .split("\n")
    .map(
      (line) =>
        `<span class="line">${line.replace(
          /[&<>"']/g,
          (character) =>
            ({
              "&": "&amp;",
              "'": "&#39;",
              '"': "&quot;",
              "<": "&lt;",
              ">": "&gt;",
            })[character]!,
        )}</span>`,
    )
    .join("")}</code></pre>`;
}
