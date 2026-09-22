import {
  RiCloseLine,
  RiDeleteBinLine,
  RiLoader4Line,
  RiSendPlane2Line,
} from "@remixicon/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";

import type { PublicAiChatConfig } from "../types";
import type { BuiltInThemeName } from "../theme/names";
import { cn } from "../lib/utils";
import { DocsLink } from "./docs-link";
import { Icon } from "./icons";
import { Button } from "./ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
} from "./ui/input-group";
import { ScrollArea } from "./ui/scroll-area";

const AI_CHAT_ENDPOINT = "/heyo-docs-internal/ai-chat";
const PI_CHAT_HISTORY_KEY = "heyo-docs:pi-chat:messages";

type ChatStatus = "ready" | "submitted" | "streaming" | "error";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

type ChatStreamEvent =
  { type: "text-delta"; text: string } | { type: "done" } | { type: "error" };

function messageId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `heyo-docs-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function textMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return { id: messageId(), role, text };
}

function chatHistoryFrom(value: unknown): ChatMessage[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const messages: ChatMessage[] = [];
  for (const message of value) {
    if (
      !isRecord(message) ||
      typeof message.id !== "string" ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.text !== "string" ||
      !message.text.trim()
    )
      return undefined;
    messages.push({ id: message.id, role: message.role, text: message.text });
  }
  return messages;
}

function chatEvents(frame: string): ChatStreamEvent[] {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return [];
  try {
    const event: unknown = JSON.parse(data);
    if (!isRecord(event) || typeof event.type !== "string") return [];
    if (event.type === "text-delta" && typeof event.text === "string")
      return [{ type: "text-delta", text: event.text }];
    if (event.type === "done" || event.type === "error")
      return [{ type: event.type }];
  } catch {
    // Ignore a malformed stream frame and wait for a valid terminal frame.
  }
  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function usePiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<Error>();
  const messagesRef = useRef(messages);
  const requestRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const replaceMessages = useCallback((nextMessages: ChatMessage[]) => {
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
  }, []);

  const stop = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = undefined;
    setStatus("ready");
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (requestRef.current) return;

    const userMessage = textMessage("user", text);
    const assistantMessage = textMessage("assistant", "");
    const requestMessages = [...messagesRef.current, userMessage];
    const nextMessages = [...requestMessages, assistantMessage];
    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setError(undefined);
    setStatus("submitted");

    const request = new AbortController();
    requestRef.current = request;
    const appendText = (delta: string) => {
      setMessages((currentMessages) => {
        const updated = currentMessages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                text: `${message.text}${delta}`,
              }
            : message,
        );
        messagesRef.current = updated;
        return updated;
      });
    };

    try {
      const response = await fetch(AI_CHAT_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: requestMessages.map(({ role, text }) => ({ role, text })),
        }),
        signal: request.signal,
      });
      if (!response.ok || !response.body)
        throw new Error("AI chat request could not be completed.");

      setStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      let streamError = false;
      const consume = (value: string) => {
        pending += value;
        const frames = pending.split(/\r?\n\r?\n/);
        pending = frames.pop() ?? "";
        for (const frame of frames) {
          for (const event of chatEvents(frame)) {
            if (event.type === "text-delta") appendText(event.text);
            if (event.type === "error") streamError = true;
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (value) consume(decoder.decode(value, { stream: !done }));
        if (done) break;
      }
      consume(decoder.decode());
      if (streamError) throw new Error("AI chat stream could not complete.");
      setStatus("ready");
    } catch {
      if (!request.signal.aborted) {
        setError(new Error("AI chat request could not be completed."));
        setStatus("error");
        setMessages((currentMessages) => {
          const updated = currentMessages.filter(
            (message) =>
              message.id !== assistantMessage.id ||
              Boolean(message.text.trim()),
          );
          messagesRef.current = updated;
          return updated;
        });
      }
    } finally {
      if (requestRef.current === request) requestRef.current = undefined;
    }
  }, []);

  return { error, messages, replaceMessages, sendMessage, status, stop };
}

const aiChatThemeStyles = {
  grain: {
    composer: "rounded-md border-foreground/5 shadow-none",
    trigger: "rounded-none border-foreground/5 shadow-none",
    drawer:
      "!m-0 !h-dvh !max-h-dvh !w-[min(100%,26rem)] !rounded-none !border-y-0 !border-r-0 !border-l !border-foreground/5 !bg-background !shadow-none sm:!w-[26rem]",
    header: "border-foreground/5 bg-background",
    footer: "border-foreground/5 bg-background",
  },
  shade: {
    composer: "rounded-md border-border shadow-lg",
    trigger: "rounded-md shadow-lg",
    drawer: "w-[calc(100%-1rem)] sm:w-[26rem]",
    header: "border-border",
    footer: "border-border",
  },
  moss: {
    composer: "rounded-md border-border shadow-lg",
    trigger: "rounded-lg shadow-md",
    drawer: "w-[calc(100%-1rem)] border-border bg-card sm:w-[26rem]",
    header: "border-border",
    footer: "border-border bg-card",
  },
} satisfies Record<
  BuiltInThemeName,
  {
    composer: string;
    trigger: string;
    drawer: string;
    header: string;
    footer: string;
  }
>;

function ChatComposer({
  onSend,
  placeholder,
  status,
  variant = "input",
}: {
  onSend: (text: string) => void;
  placeholder: string;
  status: "ready" | "submitted" | "streaming" | "error";
  variant?: "input" | "textarea";
}) {
  const [input, setInput] = useState("");
  const loading = status === "submitted" || status === "streaming";
  const canSend = Boolean(input.trim()) && !loading;

  function send() {
    const text = input.trim();
    if (!text || !canSend) return;
    setInput("");
    onSend(text);
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setInput(event.target.value);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  if (variant === "textarea") {
    return (
      <InputGroup>
        <InputGroupTextarea
          aria-label="Ask AI about the documentation"
          className="h-10 min-h-10 max-h-10"
          disabled={loading}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          value={input}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            aria-label="Send question"
            className="ml-auto"
            disabled={!canSend}
            onClick={send}
            size="icon-xs"
            type="button"
            variant="outline"
          >
            <RiSendPlane2Line />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    );
  }

  return (
    <InputGroup className="h-10">
      <InputGroupInput
        aria-label="Ask AI about the documentation"
        className="h-full px-3 text-sm md:text-sm"
        disabled={loading}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={loading ? "Generating…" : placeholder}
        value={input}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label="Send question"
          className="mr-1"
          disabled={!canSend}
          onClick={send}
          size="icon-xs"
          type="button"
          variant="outline"
        >
          <RiSendPlane2Line />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function TypingIndicator() {
  return (
    <div
      aria-label="AI is generating a response"
      className="flex h-5 items-center"
      role="status"
    >
      <RiLoader4Line
        aria-hidden="true"
        className="size-3 animate-spin text-muted-foreground"
      />
    </div>
  );
}

function MessageList({
  assistantName,
  error,
  loading,
  messages,
}: {
  assistantName: string;
  error: Error | undefined;
  loading: boolean;
  messages: ChatMessage[];
}) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="px-4 py-5">
        {!messages.length ? (
          <p className="text-sm text-muted-foreground">
            Ask a question about this documentation.
          </p>
        ) : null}
        <div className="flex flex-col gap-5">
          {messages.map((message) => {
            const isPendingAssistantMessage =
              loading && message.role === "assistant" && !message.text.trim();

            return (
              <div key={message.id}>
                {isPendingAssistantMessage ? (
                  <TypingIndicator />
                ) : (
                  <>
                    <p className="mb-1 text-xs/relaxed font-medium text-muted-foreground">
                      {message.role === "user" ? "You" : assistantName}
                    </p>
                    {message.role === "user" ? (
                      <p className="whitespace-pre-wrap text-sm">
                        {message.text}
                      </p>
                    ) : (
                      <div className="space-y-3 break-words text-sm [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3">
                        <ReactMarkdown
                          components={{
                            a: ({ children, href, ...props }) =>
                              href?.startsWith("/") &&
                              !href.startsWith("//") ? (
                                <DocsLink href={href} {...props}>
                                  {children}
                                </DocsLink>
                              ) : (
                                <a href={href} {...props}>
                                  {children}
                                </a>
                              ),
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {loading && messages.at(-1)?.role !== "assistant" ? (
            <TypingIndicator />
          ) : null}
          {error ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              AI chat is unavailable. Please try again.
            </p>
          ) : null}
          <div aria-hidden="true" ref={scrollEndRef} />
        </div>
      </div>
    </ScrollArea>
  );
}

export function AiChat({
  chatConfig,
  theme,
}: {
  chatConfig: PublicAiChatConfig;
  theme: BuiltInThemeName;
}) {
  const [open, setOpen] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const styles = aiChatThemeStyles[theme];
  const { error, messages, replaceMessages, sendMessage, status, stop } =
    usePiChat();

  useEffect(() => {
    const history = window.sessionStorage.getItem(PI_CHAT_HISTORY_KEY);
    if (history) {
      try {
        const storedMessages = chatHistoryFrom(JSON.parse(history));
        if (storedMessages) replaceMessages(storedMessages);
        else window.sessionStorage.removeItem(PI_CHAT_HISTORY_KEY);
      } catch {
        window.sessionStorage.removeItem(PI_CHAT_HISTORY_KEY);
      }
    }
    setHistoryReady(true);
  }, [replaceMessages]);

  useEffect(() => {
    if (!historyReady) return;
    if (!messages.length) {
      window.sessionStorage.removeItem(PI_CHAT_HISTORY_KEY);
      return;
    }
    window.sessionStorage.setItem(
      PI_CHAT_HISTORY_KEY,
      JSON.stringify(messages),
    );
  }, [historyReady, messages]);

  function send(text: string) {
    setOpen(true);
    void sendMessage(text);
  }

  function clearHistory() {
    void stop();
    replaceMessages([]);
    window.sessionStorage.removeItem(PI_CHAT_HISTORY_KEY);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) clearHistory();
  }

  return (
    <>
      {chatConfig.variant === "center" && !open ? (
        <div
          className={cn(
            "fixed bottom-2 left-1/2 z-40 m-0 w-[calc(100%-2rem)] max-w-[23rem] -translate-x-1/2 border bg-background p-0",
            styles.composer,
          )}
        >
          <ChatComposer
            onSend={send}
            placeholder={chatConfig.placeholder}
            status={status}
          />
        </div>
      ) : null}
      {chatConfig.variant === "right" ? (
        <Button
          className={cn("fixed right-4 bottom-4 z-40", styles.trigger)}
          onClick={() => setOpen(true)}
          size="lg"
        >
          <Icon className="size-4" name={chatConfig.icon} />
          {chatConfig.text}
        </Button>
      ) : null}
      <Drawer
        disablePointerDismissal
        modal={false}
        onOpenChange={handleOpenChange}
        open={open}
        swipeDirection="right"
      >
        <DrawerContent className={styles.drawer}>
          <DrawerHeader
            className={cn(
              "flex-row items-center justify-between border-b p-4",
              styles.header,
            )}
          >
            <div>
              <DrawerTitle>{chatConfig.name}</DrawerTitle>
              <DrawerDescription className="sr-only">
                Ask questions about the documentation.
              </DrawerDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Clear AI chat"
                onClick={clearHistory}
                size="icon-sm"
                variant="ghost"
              >
                <RiDeleteBinLine />
              </Button>
              <DrawerClose render={<Button size="icon-sm" variant="ghost" />}>
                <RiCloseLine />
                <span className="sr-only">Close AI chat</span>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <MessageList
            assistantName={chatConfig.name}
            error={error}
            loading={status === "submitted" || status === "streaming"}
            messages={messages}
          />
          <div className={cn("border-t p-4", styles.footer)}>
            <ChatComposer
              onSend={send}
              placeholder={chatConfig.placeholder}
              status={status}
              variant="textarea"
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
