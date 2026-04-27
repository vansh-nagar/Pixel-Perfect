"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Check, Code2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const BASE_URL = "https://www.pixel-perfect.space/r";

type PackageManager = {
  name: string;
  label: string;
  prefix: string;
};

const PACKAGE_MANAGERS: PackageManager[] = [
  { name: "npm", label: "npm", prefix: "npx shadcn@latest add" },
  { name: "pnpm", label: "pnpm", prefix: "pnpm dlx shadcn@latest add" },
  { name: "bun", label: "bun", prefix: "bunx --bun shadcn@latest add" },
  { name: "yarn", label: "yarn", prefix: "npx shadcn@latest add" },
];

export function getInstallCommand(
  registryName: string,
  pm: string = "npm",
): string {
  const manager = PACKAGE_MANAGERS.find((m) => m.name === pm);
  if (!manager) return `npx shadcn@latest add ${BASE_URL}/${registryName}.json`;
  return `${manager.prefix} ${BASE_URL}/${registryName}.json`;
}

interface CopyDropdownProps {
  registryName: string;
  variant?: "copy" | "ghost" | "secondary";
  className?: string;
}

export default function CopyDropdown({
  registryName,
  variant = "copy",
  className = "",
}: CopyDropdownProps) {
  const [copiedPm, setCopiedPm] = useState<string | null>(null);
  const [copyingCode, setCopyingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopy = (pm: PackageManager) => {
    const command = getInstallCommand(registryName, pm.name);
    navigator.clipboard.writeText(command);
    setCopiedPm(pm.name);
    toast.success(`${pm.label} command copied!`);
    setTimeout(() => setCopiedPm(null), 2000);
  };

  const handleCopyCode = async () => {
    setCopyingCode(true);
    try {
      const res = await fetch(`${BASE_URL}/${registryName}.json`);
      const data = await res.json();
      const code: string = data.files?.[0]?.content ?? "";
      if (!code) {
        toast.error("No source code found.");
        return;
      }
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast.error("Failed to fetch code.");
    } finally {
      setCopyingCode(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size={"sm"}
          variant={variant}
          className={`text-xs cursor-pointer z-30 relative border border-dashed right-1 top-1 rounded-none ${className}`}
        >
          <Copy className="size-3" /> Copy
          <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed"></span>
          <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2 border-dashed"></span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-none border-dashed"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Copy install command
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PACKAGE_MANAGERS.map((pm) => (
          <DropdownMenuItem
            key={pm.name}
            onClick={() => handleCopy(pm)}
            className="cursor-pointer font-mono text-xs gap-3"
          >
            <span className="font-sans font-medium min-w-12">{pm.label}</span>
            <span className="text-muted-foreground truncate flex-1">
              {getInstallCommand(registryName, pm.name)}
            </span>
            {copiedPm === pm.name ? (
              <Check className="size-3 text-green-500 shrink-0" />
            ) : (
              <Copy className="size-3 shrink-0 opacity-50" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Copy source code
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={handleCopyCode}
          disabled={copyingCode}
          className="cursor-pointer font-mono text-xs gap-3"
        >
          <span className="font-sans font-medium min-w-12 flex items-center gap-1.5">
            <Code2 className="size-3" /> code
          </span>
          <span className="text-muted-foreground truncate flex-1">
            {copyingCode ? "Fetching…" : `${registryName}.tsx`}
          </span>
          {copyingCode ? (
            <Loader2 className="size-3 animate-spin shrink-0" />
          ) : codeCopied ? (
            <Check className="size-3 text-green-500 shrink-0" />
          ) : (
            <Copy className="size-3 shrink-0 opacity-50" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
