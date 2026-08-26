import { useEffect, useState } from "react";

import { cn } from "../../../../lib/utils";
import { textFromNode, type WithChildren } from "./shared";

interface MermaidProps extends WithChildren {
  chart?: string;
  className?: string;
  /** Output format. SVG uses the active documentation color tokens. */
  variant?: "svg" | "ascii";
}

type BeautifulMermaidRuntime = typeof import("beautiful-mermaid");

let beautifulMermaidLoader: Promise<BeautifulMermaidRuntime> | undefined;

function loadBeautifulMermaid() {
  beautifulMermaidLoader ??= import("beautiful-mermaid");
  return beautifulMermaidLoader;
}

/** Renders diagrams client-side while retaining the source during SSR. */
export function Mermaid({
  chart,
  children,
  className,
  variant = "svg",
}: MermaidProps) {
  const [error, setError] = useState<string>();
  const [output, setOutput] = useState<string>();
  const source = chart ?? textFromNode(children).trim();

  useEffect(() => {
    let mounted = true;
    setError(undefined);
    setOutput(undefined);

    async function renderDiagram() {
      try {
        const { renderMermaidASCII, renderMermaidSVG } =
          await loadBeautifulMermaid();
        const result =
          variant === "ascii"
            ? renderMermaidASCII(source, { colorMode: "none" })
            : renderMermaidSVG(source, {
                bg: "var(--background)",
                fg: "var(--foreground)",
                muted: "var(--muted-foreground)",
                surface: "var(--card)",
                border: "var(--border)",
                font: "var(--heyo-docs-font-family)",
                transparent: true,
              });
        if (mounted) setOutput(result);
      } catch {
        if (mounted) setError("The Mermaid diagram could not be rendered.");
      }
    }

    if (source) void renderDiagram();
    return () => {
      mounted = false;
    };
  }, [source, variant]);

  return (
    <figure
      data-slot="mermaid"
      className={cn(
        "not-prose my-5 overflow-x-auto rounded-xl border border-foreground/10 bg-card p-4",
        className,
      )}
    >
      {output && variant === "svg" ? (
        <div
          className="min-w-max [&_svg]:mx-auto"
          dangerouslySetInnerHTML={{ __html: output }}
        />
      ) : output ? (
        <pre className="m-0 mx-auto w-max font-mono text-xs leading-5 text-foreground">
          {output}
        </pre>
      ) : (
        <pre className="m-0 text-xs leading-6 text-muted-foreground">
          {source}
        </pre>
      )}
      {error ? (
        <figcaption className="mt-3 text-sm text-destructive">
          {error}
        </figcaption>
      ) : null}
    </figure>
  );
}
