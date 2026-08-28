"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  Camera,
  Columns2,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  RectangleVertical,
  SlidersVertical,
  Sparkles,
  SquarePlus,
  Video,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

/* Borderless inline dropdown used across the composer's bottom bar. */
const INLINE_TRIGGER =
  "gap-1 border-0 bg-transparent px-2 text-[13px] font-medium shadow-none hover:bg-accent focus-visible:ring-0 data-[size=sm]:h-7 [&>svg]:opacity-50";

const DIVIDER = "data-[orientation=vertical]:h-5";

const MODELS = ["PixVerse V6", "PixVerse V5", "PixVerse V4.5"];
const QUALITIES = ["360p", "540p", "720p", "1080p"];
const DURATIONS = ["5s", "8s", "10s"];
const RATIOS = ["16:9", "9:16", "1:1", "4:3"];

const TABS = [
  { value: "images", label: "Images", icon: Camera },
  { value: "videos", label: "Videos", icon: Video },
  { value: "slideshow", label: "Slideshow", icon: GalleryHorizontalEnd },
];

const Page = () => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-5xl">
        {/* Gray tray — the white composer breaks out wider than it */}
        <div className="rounded-[28px] bg-zinc-100 px-8 pt-3 pb-3">
          {/* Templates strip */}
          <div className="flex items-center gap-2.5 pb-3">
            <span className="text-[13px] text-muted-foreground">
              Also with <span className="font-semibold text-foreground">PixVerse V6</span>
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-full border-zinc-200 bg-background px-4 text-[13px] font-medium"
            >
              <SquarePlus className="text-muted-foreground" />
              Extend a clip
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-full border-zinc-200 bg-background px-4 text-[13px] font-medium"
            >
              <Columns2 className="text-muted-foreground" />
              First frame to last
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 rounded-full px-3 text-[13px] font-normal text-muted-foreground hover:bg-zinc-200/60"
            >
              All templates
              <ArrowRight className="size-3.5" />
            </Button>
          </div>

          {/* Composer */}
          <div className="-mx-8 rounded-[22px] border border-zinc-200 bg-background shadow-sm">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="handheld walk through a neon-lit street at night"
              className="min-h-[76px] resize-none border-0 bg-transparent px-5 pt-4 pb-0 text-[15px] shadow-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-[15px]"
            />

            <div className="flex items-center justify-between gap-2 px-3 pt-1 pb-3">
              {/* Generation settings */}
              <div className="flex items-center gap-0.5">
                <Sparkles className="ml-1.5 size-4 fill-indigo-500 text-indigo-500" />
                <Select defaultValue="PixVerse V6">
                  <SelectTrigger size="sm" className={INLINE_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Separator orientation="vertical" className={DIVIDER} />

                <Select defaultValue="720p">
                  <SelectTrigger size="sm" className={INLINE_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITIES.map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Separator orientation="vertical" className={DIVIDER} />

                <Select defaultValue="5s">
                  <SelectTrigger size="sm" className={INLINE_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Separator orientation="vertical" className={DIVIDER} />

                <RectangleVertical className="ml-1.5 size-4 text-muted-foreground" />
                <Select defaultValue="9:16">
                  <SelectTrigger size="sm" className={INLINE_TRIGGER}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RATIOS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Sound"
                  className="size-7 rounded-md text-blue-500 hover:bg-accent hover:text-blue-500"
                >
                  <Volume2 />
                </Button>

                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Advanced settings"
                  className="ml-2 size-8 rounded-lg border-zinc-200 text-foreground"
                >
                  <SlidersVertical />
                </Button>
              </div>

              {/* Inputs + submit */}
              <div className="flex items-center gap-1 rounded-full bg-zinc-50 p-1 pl-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 rounded-full border-zinc-200 bg-background px-3 text-[13px] font-medium"
                >
                  <ImageIcon className="text-muted-foreground" />
                  Image
                </Button>

                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Add reference"
                  className="size-8 rounded-full border-zinc-200 text-muted-foreground"
                >
                  <SquarePlus />
                </Button>

                <span className="flex items-center gap-1 px-2 text-[13px] font-medium text-muted-foreground">
                  <Sparkles className="size-3.5" />
                  40
                </span>

                <Button
                  size="icon-sm"
                  aria-label="Generate"
                  disabled={!prompt.trim()}
                  className="size-8 rounded-full disabled:bg-zinc-200 disabled:text-zinc-400 disabled:opacity-100"
                >
                  <ArrowUp />
                </Button>
              </div>
            </div>
          </div>

          {/* Mode tabs */}
          <Tabs defaultValue="videos" className="pt-3">
            <TabsList className="h-auto gap-7 bg-transparent p-0 pl-1">
              {TABS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="gap-2 px-0 text-[15px] text-muted-foreground data-[state=active]:font-semibold data-[state=active]:text-foreground [&_svg]:size-[18px]"
                >
                  <Icon />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Page;
