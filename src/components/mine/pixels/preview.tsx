import React from "react";
import { ExternalLink } from "lucide-react";

export interface PreviewProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  code?: string;
  githubUrl?: string;
}

const OPEN_IN_LINKS = [
  {
    name: "V0",
    url: (code: string) => `https://v0.dev?code=${encodeURIComponent(code)}`,
    icon: "V0",
  },
  {
    name: "GitHub Gist",
    url: (code: string) => `https://gist.github.com/`,
    icon: "GH",
  },
  {
    name: "Scira AI",
    url: (code: string) => `https://scira.ai?code=${encodeURIComponent(code)}`,
    icon: "SA",
  },
  {
    name: "ChatGPT",
    url: (code: string) => `https://chat.openai.com/`,
    icon: "GP",
  },
  { name: "Claude", url: (code: string) => `https://claude.ai/`, icon: "CL" },
  { name: "T3 Chat", url: (code: string) => `https://t3.gg/chat`, icon: "T3" },
];

export function Preview({
  children,
  title,
  description,
  className = "",
  code,
  githubUrl,
}: PreviewProps) {
  return (
    <div className={` ${className}  rounded-xl border border-dashed p-3`}>
      {children}
    </div>
  );
}

export default Preview;
