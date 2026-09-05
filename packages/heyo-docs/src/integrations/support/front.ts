import { z } from "zod";

const frontChatIdSchema = z.string().trim().min(6).max(256);

/**
 * Source of truth: https://help.front.com/en/articles/2049
 *
 * Front requires its non-deferred `chat.bundle.js` loader to run before the
 * following `FrontChat("init", { chatId })` call. The two template tags keep
 * that parser order while the public chat ID is supplied as an attribute.
 */
export const frontSupportSchema = z
  .object({ chatId: frontChatIdSchema })
  .strict();

export type FrontSupportConfig = z.infer<typeof frontSupportSchema>;

/** Returns Front's documented, parser-blocking chat SDK URL. */
export function frontChatScript() {
  return { src: "https://chat-assets.frontapp.com/v1/chat.bundle.js" } as const;
}

/** Initializes Front Chat only after its preceding SDK script has executed. */
export function frontChatBootstrapScript(): string {
  return `(function(){var s=document.currentScript;var chatId=s&&s.getAttribute("data-front-chat-id");if(!chatId||typeof window.FrontChat!=="function"){return;}window.FrontChat("init",{chatId:chatId,useDefaultLauncher:true});})();`;
}
