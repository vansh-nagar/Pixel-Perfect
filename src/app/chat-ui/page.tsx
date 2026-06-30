"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp, Bot } from "lucide-react";

import { cn } from "@/lib/utils";
import { ThinkingIndicator } from "@/components/assistant-ui/thinking-indicator";

/* ─────────────────────────────────────────────────────────
 * A normal vertical chat UI (no backend, all motion). Flow per send:
 *
 *    0ms   user bubble springs in from the right (y+scale)
 *  120ms   assistant "thinking" bubble: the dot-matrix loader + status label
 *          (Connecting → Thinking → Generating) — the DotmSquare11 animation
 *  2200ms  thinking bubble exits, assistant bubble springs in and the reply
 *          streams in word-by-word with a blinking caret; list auto-scrolls
 *
 * Type and hit ↵ to replay. Honors prefers-reduced-motion.
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  thinkDelay: 2200, // ms the dot-matrix thinking indicator shows before streaming
  wordInterval: 55, // ms between each streamed word
};

/* Snappy-but-soft spring used for every bubble entrance. */
const ENTRANCE_SPRING = { type: "spring" as const, stiffness: 420, damping: 30 };

type Role = "user" | "assistant";

interface Message {
  id: number;
  role: Role;
  text: string;
  streaming?: boolean; // assistant bubble currently revealing word-by-word
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 0,
    role: "assistant",
    text: "Hey! Ask me anything — I'll think for a moment, then stream a reply.",
  },
];

/* Canned replies cycle on each send — they only exist to drive the animation. */
const CANNED_REPLIES = [
  "Good motion is mostly timing and restraint: animate a property or two, keep it under 300ms, and let the easing do the talking.",
  "The magic in a chat UI is the small stuff — a thinking indicator, a word-by-word reveal, and an auto-scroll that never fights the reader.",
  "I'd reach for a spring on entrance and an ease-out on exit. Springs feel alive; ease-outs feel polished and final.",
  "Try staggering each word by ~40–60ms as it streams. It reads like real thinking instead of a paste.",
];

const Page = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(INITIAL_MESSAGES.length);
  const replyRef = useRef(0);
  const reduceMotion = useReducedMotion();

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [reduceMotion]);

  // Keep the latest message / thinking bubble in view.
  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, scrollToBottom]);

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

    // Dot-matrix thinking indicator first, then the assistant bubble streams in.
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
    <div className="chat-light grid min-h-screen place-items-center bg-background p-4 text-foreground">
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

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                reduceMotion={!!reduceMotion}
                onStreamDone={markStreamDone}
                onType={scrollToBottom}
              />
            ))}
            {isThinking && (
              <motion.div
                key="thinking"
                layout
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-border px-3 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="h-10 flex-1 rounded-full bg-muted px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isThinking}
            whileTap={{ scale: 0.88 }}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            aria-label="Send message"
          >
            <ArrowUp className="size-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

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

interface MessageBubbleProps {
  message: Message;
  reduceMotion: boolean;
  onStreamDone: (id: number) => void;
  onType: () => void;
}

function MessageBubble({
  message,
  reduceMotion,
  onStreamDone,
  onType,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  // Stable so StreamingText's interval effect doesn't churn each render.
  const handleDone = useCallback(
    () => onStreamDone(message.id),
    [onStreamDone, message.id],
  );

  return (
    <motion.div
      layout
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={ENTRANCE_SPRING}
      className={cn("flex w-full gap-2", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && <BotAvatar className="self-end" />}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
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
            onType={onType}
          />
        ) : (
          message.text
        )}
      </div>
    </motion.div>
  );
}

interface StreamingTextProps {
  text: string;
  reduceMotion: boolean;
  onDone: () => void;
  onType: () => void;
}

/* Reveals text one word at a time; each new word fades in, a caret blinks at
 * the tail until the last word lands. */
function StreamingText({ text, reduceMotion, onDone, onType }: StreamingTextProps) {
  const words = useMemo(() => text.split(" "), [text]);
  const [count, setCount] = useState(reduceMotion ? words.length : 0);

  useEffect(() => {
    if (count >= words.length) {
      onDone();
      return;
    }
    const t = window.setTimeout(() => {
      setCount((c) => c + 1);
      onType();
    }, TIMING.wordInterval);
    return () => window.clearTimeout(t);
  }, [count, words.length, onDone, onType]);

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

export default Page;
