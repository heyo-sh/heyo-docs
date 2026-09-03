import { z } from "zod";

const typebotApiHostSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  }, "Typebot apiHost must be an HTTPS URL without a query or fragment.")
  .transform((value) => value.replace(/\/$/, ""));

/**
 * Source of truth: https://docs.typebot.com/deploy/web/html-javascript
 *
 * Typebot's documented browser module initializes a bubble with a public bot
 * ID. `apiHost` is optional and only changes the Typebot backend for a
 * self-hosted deployment.
 */
export const typebotSupportSchema = z
  .object({
    typebot: z.string().trim().min(1).max(256),
    apiHost: typebotApiHostSchema.optional(),
  })
  .strict();

export type TypebotSupportConfig = z.infer<typeof typebotSupportSchema>;

/** Imports Typebot's browser module and creates its documented chat bubble. */
export function typebotBootstrapScript(): string {
  return `import Typebot from "https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js";var s=document.querySelector("script[data-heyo-typebot]");var typebot=s&&s.getAttribute("data-typebot-id");var apiHost=s&&s.getAttribute("data-typebot-api-host");if(typebot){var options={typebot:typebot};if(apiHost){options.apiHost=apiHost;}Typebot.initBubble(options);}`;
}
