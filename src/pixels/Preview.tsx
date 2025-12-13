import React from "react";
import { ExternalLink } from "lucide-react";

export interface PreviewProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  code?: string; // The code to share/open in various platforms
  githubUrl?: string; // Optional direct GitHub link
}

const OPEN_IN_LINKS = [
  {
    name: "V0",
    url: (code: string) => `https://v0.dev?code=${encodeURIComponent(code)}`,
    icon: "",
  },
  {
    name: "GitHub Gist",
    url: (code: string) => `https://gist.github.com/`,
    icon: "",
  },
  {
    name: "Scira AI",
    url: (code: string) => `https://scira.ai?code=${encodeURIComponent(code)}`,
    icon: "",
  },
  {
    name: "ChatGPT",
    url: (code: string) => `https://chat.openai.com/`,
    icon: "",
  },
  { name: "Claude", url: (code: string) => `https://claude.ai/`, icon: "" },
  { name: "T3 Chat", url: (code: string) => `https://t3.gg/chat`, icon: "" },
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
    <div className={`my-6 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        {title && (
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        )}
        {code && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">Open in:</span>
            <div className="flex gap-1">
              {OPEN_IN_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url(code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
                  title={`Open in ${link.name}`}
                >
                  <span>{link.icon}</span>
                  <span className="hidden sm:inline">{link.name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      <div className="border rounded-lg p-6 bg-muted/50">{children}</div>
    </div>
  );
}

export default Preview;
