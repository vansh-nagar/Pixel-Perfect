import { generatePageMetadata } from "@/lib/seo/metadata";

// Server wrapper: the chat-ui page is a client component and can't export metadata.
export const metadata = generatePageMetadata({
  title: "Animated Chat UI",
  description:
    "A polished React chat interface demo — anchored message scrolling, streamed-reply auto-follow, thinking indicators and motion-driven message transitions, all copyable.",
  path: "/chat-ui",
});

export default function ChatUiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
