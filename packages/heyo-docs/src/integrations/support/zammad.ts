import { z } from "zod";

const zammadBaseUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  }, "Zammad baseUrl must be an HTTPS URL without a query or fragment.")
  .transform((value) => value.replace(/\/$/, ""));

/**
 * Source of truth: https://admin-docs.zammad.org/en/latest/channels/chat.html
 *
 * Zammad offers a no-jQuery widget variant and generates a `ZammadChat`
 * snippet for each configured chat. The template loads that script first and
 * then constructs the chat with its public numeric chat ID.
 */
export const zammadSupportSchema = z
  .object({
    baseUrl: zammadBaseUrlSchema,
    chatId: z.number().int().positive(),
  })
  .strict();

export type ZammadSupportConfig = z.infer<typeof zammadSupportSchema>;

/** Returns Zammad's no-jQuery browser widget URL for an instance. */
export function zammadChatScript(config: ZammadSupportConfig) {
  return {
    src: `${config.baseUrl}/assets/chat/chat-no-jquery.js`,
  } as const;
}

/** Starts Zammad's automatically displayed chat after its SDK has loaded. */
export function zammadBootstrapScript(): string {
  return `(function(){var s=document.currentScript;var chatId=s&&s.getAttribute("data-zammad-chat-id");var id=chatId&&Number(chatId);if(!Number.isSafeInteger(id)||id<1||typeof window.ZammadChat!=="function"){return;}new window.ZammadChat({chatId:id,fontSize:"12px"});})();`;
}
