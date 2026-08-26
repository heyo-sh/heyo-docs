import { useState } from "react";

import { Button } from "../../../components/ui/button";
import { Icon } from "../../../components/icons";

const markdownCache = new Map<string, Promise<string>>();

interface CopyForLlmProps {
  /** URL of the generated Markdown endpoint for the current page. */
  markdownUrl: string;
}

export function CopyForLlm({ markdownUrl }: CopyForLlmProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copy = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      let source = markdownCache.get(markdownUrl);
      if (!source) {
        source = fetch(markdownUrl).then(async (response) => {
          if (!response.ok)
            throw new Error(`Unable to load Markdown (${response.status})`);
          return response.text();
        });
        markdownCache.set(markdownUrl, source);
      }

      await navigator.clipboard.writeText(await source);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1_800);
    } catch {
      markdownCache.delete(markdownUrl);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      aria-label="Copy this page as Markdown for an LLM"
      disabled={isLoading}
      onClick={copy}
      size="sm"
      variant="outline"
    >
      <Icon data-icon="inline-start" name={isCopied ? "check" : "copy"} />
      Copy for LLM
    </Button>
  );
}
