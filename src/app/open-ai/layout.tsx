import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata = generatePageMetadata({
  title: "OpenAI animation study",
  description: "An avatar carousel: the dots characters, custom plush characters, and DevDay-style faces.",
  path: "/open-ai",
  noIndex: true,
});

export default function OpenAiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
