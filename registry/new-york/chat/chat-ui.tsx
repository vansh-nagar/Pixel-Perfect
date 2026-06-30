"use client";

/**
 * A streaming chat UI built on MessageScroller — anchored turns, follow-the-edge auto-scroll, a dot-matrix thinking indicator, and word-by-word reveal.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, Bot } from "lucide-react";

import { cn } from "@/lib/utils";
import { DotmSquare11 } from "@/components/ui/dotm-square-11";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";

const TIMING = {
  thinkDelay: 2200, // ms the dot-matrix thinking indicator shows before streaming
  wordInterval: 55, // ms between each streamed word
};

/* Snappy-but-soft spring used for every row entrance. */
const ENTRANCE_SPRING = { type: "spring" as const, stiffness: 420, damping: 30 };

/* Animate the transcript row itself (transform + opacity only — never height/
 * margin, which would fight the scroller's positioning). */
const MotionItem = motion.create(MessageScrollerItem);

type Role = "user" | "assistant";

interface Message {
  id: number;
  role: Role;
  text: string;
  streaming?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 0,
    role: "assistant",
    text: "Hey! Ask me anything — I'll think for a moment, then stream a reply.",
  },
];

/* Canned replies cycle on each send — swap this for a real runtime. */
const CANNED_REPLIES = [
  "Good motion is mostly timing and restraint: animate a property or two, keep it under 300ms, and let the easing do the talking.",
  "The magic in a chat UI is the small stuff — a thinking indicator, a word-by-word reveal, and a scroller that never fights the reader's place.",
  "I'd reach for a spring on entrance and an ease-out on exit. Springs feel alive; ease-outs feel polished and final.",
  "Try staggering each word by ~40–60ms as it streams. It reads like real thinking instead of a paste, and keep older turns anchored so people never lose where they are.",
];

const THINKING_STATUSES = ["Connecting", "Thinking", "Generating"];

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const idRef = useRef(INITIAL_MESSAGES.length);
  const replyRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();

  // Auto-grow the composer textarea up to a max height (collapses back on send).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  const markStreamDone = useCallback((id: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)),
    );
  }, []);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || isThinking) return;

    setMessages((prev) => [...prev, { id: idRef.current++, role: "user", text }]);
    setInput("");

    setIsThinking(true);
    const reply = CANNED_REPLIES[replyRef.current % CANNED_REPLIES.length];
    replyRef.current += 1;

    window.setTimeout(() => {
      setIsThinking(false);
      setMessages((prev) => [
        ...prev,
        { id: idRef.current++, role: "assistant", text: reply, streaming: true },
      ]);
    }, TIMING.thinkDelay);
  }, [input, isThinking]);

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
      <div className="flex h-[600px] max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <BotAvatar />
          <div className="leading-tight">
            <p className="text-sm font-medium text-foreground">Assistant</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              online
            </p>
          </div>
        </div>

        {/* Transcript — MessageScroller owns scroll, anchoring, and follow-output */}
        <MessageScrollerProvider autoScroll scrollPreviousItemPeek={56}>
          <MessageScroller className="min-h-0 flex-1">
            {/* data-lenis-prevent: harmless without Lenis; lets the transcript
                scroll natively if the host app uses Lenis smooth-scroll */}
            <MessageScrollerViewport data-lenis-prevent className="px-5 py-5">
              <MessageScrollerContent className="gap-4">
                {messages.map((message) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    reduceMotion={!!reduceMotion}
                    onStreamDone={markStreamDone}
                  />
                ))}

                <AnimatePresence>
                  {isThinking && (
                    <MotionItem
                      key="thinking"
                      messageId="thinking"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={ENTRANCE_SPRING}
                      className="flex justify-start gap-2"
                    >
                      <BotAvatar className="self-end" />
                      <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-1.5">
                        <ThinkingIndicator />
                      </div>
                    </MotionItem>
                  )}
                </AnimatePresence>
              </MessageScrollerContent>
            </MessageScrollerViewport>

            <MessageScrollerButton className="shadow-sm" />
          </MessageScroller>
        </MessageScrollerProvider>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-border p-3"
        >
          <div className="flex items-end gap-2 rounded-3xl border border-border bg-muted p-1.5 transition-shadow focus-within:ring-2 focus-within:ring-ring">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Type a message…"
              aria-label="Message input"
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-3 py-1.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            />
            <motion.button
              type="submit"
              disabled={!input.trim() || isThinking}
              whileTap={{ scale: 0.88 }}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Send message"
            >
              <ArrowUp className="size-5" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* The dot-matrix "thinking" indicator: the @dotmatrix loader + a shimmering
 * status label that advances Connecting → Thinking → Generating. */
function ThinkingIndicator() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((n) => Math.min(n + 1, THINKING_STATUSES.length - 1)),
      1300,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="flex items-center gap-3 py-1"
      aria-label="Assistant is thinking"
    >
      <DotmSquare11 size={20} dotSize={2.8} className="shrink-0" />
      <span className="animate-pulse text-muted-foreground text-sm font-normal">
        {THINKING_STATUSES[step]}
      </span>
    </div>
  );
}

function BotAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground",
        className,
      )}
    >
      <Bot className="size-4" />
    </div>
  );
}

interface MessageRowProps {
  message: Message;
  reduceMotion: boolean;
  onStreamDone: (id: number) => void;
}

/* One transcript row: the animated MessageScrollerItem holding a chat bubble.
 * User rows are scroll anchors, so a new turn pins near the top of the view. */
function MessageRow({ message, reduceMotion, onStreamDone }: MessageRowProps) {
  const isUser = message.role === "user";
  const handleDone = useCallback(
    () => onStreamDone(message.id),
    [onStreamDone, message.id],
  );

  return (
    <MotionItem
      messageId={String(message.id)}
      scrollAnchor={isUser}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={ENTRANCE_SPRING}
      className={cn("flex w-full gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && <BotAvatar className="self-end" />}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        {message.streaming ? (
          <StreamingText
            text={message.text}
            reduceMotion={reduceMotion}
            onDone={handleDone}
          />
        ) : (
          message.text
        )}
      </div>
    </MotionItem>
  );
}

interface StreamingTextProps {
  text: string;
  reduceMotion: boolean;
  onDone: () => void;
}

/* Reveals text one word at a time; each new word fades in, a caret blinks at
 * the tail until the last word lands. autoScroll follows the growth. */
function StreamingText({ text, reduceMotion, onDone }: StreamingTextProps) {
  const words = useMemo(() => text.split(" "), [text]);
  const [count, setCount] = useState(reduceMotion ? words.length : 0);

  useEffect(() => {
    if (count >= words.length) {
      onDone();
      return;
    }
    const t = window.setTimeout(() => {
      setCount((c) => c + 1);
    }, TIMING.wordInterval);
    return () => window.clearTimeout(t);
  }, [count, words.length, onDone]);

  return (
    <span>
      {words.slice(0, count).map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
        >
          {i > 0 ? " " : ""}
          {word}
        </motion.span>
      ))}
      {count < words.length && (
        <motion.span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </span>
  );
}

export default ChatUI;
