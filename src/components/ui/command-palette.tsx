"use client";

import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Search,
  Settings,
  Smile,
  User,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "./button";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [isMac, setIsMac] = React.useState(false);

  // Toggle on ⌘J or Ctrl+J
  React.useEffect(() => {
    setIsMac(
      typeof window !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    );

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button variant={"outline"} className="text-sm text-muted-foreground">
        <Search /> <span className=" mr-10">Search...</span>
        <kbd className="bg-muted font-pixelify text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none">
          {isMac ? (
            <>
              <span className="text-xs">⌘</span>K
            </>
          ) : (
            <>Ctrl+K</>
          )}
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />

        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Suggestions */}
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <Calendar />
              <span>Calendar</span>
            </CommandItem>

            <CommandItem>
              <Smile />
              <span>Search Emoji</span>
            </CommandItem>

            <CommandItem>
              <Calculator />
              <span>Calculator</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Settings */}
          <CommandGroup heading="Settings">
            <CommandItem>
              <User />
              <span>Profile</span>
              <CommandShortcut>{isMac ? "⌘P" : "Ctrl+P"}</CommandShortcut>
            </CommandItem>

            <CommandItem>
              <CreditCard />
              <span>Billing</span>
              <CommandShortcut>{isMac ? "⌘B" : "Ctrl+B"}</CommandShortcut>
            </CommandItem>

            <CommandItem>
              <Settings />
              <span>Settings</span>
              <CommandShortcut>{isMac ? "⌘S" : "Ctrl+S"}</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
