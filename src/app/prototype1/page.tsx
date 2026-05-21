"use client";

import {
  PlayCircle02Icon,
  RoboticIcon,
  File01Icon,
  BookOpen01Icon,
  CallOutgoing02Icon,
  ChatBotIcon,
  BubbleChatPreviewIcon,
  ChartHistogramIcon,
  Comment01Icon,
  Flag01Icon,
  Stamp01Icon,
  CheckListIcon,
  DashboardSquare01Icon,
  Settings01Icon,
  SidebarLeft01Icon,
  PlusSignIcon,
  Sun03Icon,
  Moon02Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useTheme } from "next-themes";
import { useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const EASE = "cubic-bezier(0.165,0.85,0.45,1)";
const DURATION = 300;
const EXPANDED = "265px";
const COLLAPSED = "52px";

const fade = (collapsed: boolean): CSSProperties => ({
  transition: `opacity 150ms ${EASE}`,
  opacity: collapsed ? 0 : 1,
  pointerEvents: collapsed ? "none" : "auto",
});

type NavItem = {
  icon: typeof PlayCircle02Icon;
  label: string;
  trailing?: "add";
};

const BUILD_ITEMS: NavItem[] = [
  { icon: PlayCircle02Icon, label: "Playground", trailing: "add" },
  { icon: RoboticIcon, label: "Personas" },
  { icon: File01Icon, label: "Scenarios", trailing: "add" },
  { icon: BookOpen01Icon, label: "Knowledge Bases" },
  { icon: CallOutgoing02Icon, label: "Batch Calls" },
  { icon: ChatBotIcon, label: "Global Prompts" },
];

const MONITOR_ITEMS: NavItem[] = [
  { icon: BubbleChatPreviewIcon, label: "Conversation" },
  { icon: ChartHistogramIcon, label: "Dashboard" },
  { icon: Comment01Icon, label: "Messaging" },
  { icon: Flag01Icon, label: "Quality Dashboard" },
  { icon: Stamp01Icon, label: "Reports" },
  { icon: CheckListIcon, label: "Tasks" },
];

const FOOTER_ITEMS: NavItem[] = [
  { icon: DashboardSquare01Icon, label: "Configuration" },
  { icon: Settings01Icon, label: "Settings" },
];

type Theme = "dark" | "light" | "system";

export default function Page() {
  const [active, setActive] = useState("Playground");
  const [collapsed, setCollapsed] = useState(false);
  const { theme: rawTheme, setTheme: setRawTheme } = useTheme();
  const theme: Theme =
    rawTheme === "dark" || rawTheme === "light" || rawTheme === "system"
      ? rawTheme
      : "system";
  const setTheme = (next: Theme) => setRawTheme(next);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, {
    damping: 30,
    stiffness: 250,
    mass: 0.5,
  });
  const blurPx = useTransform(
    smoothVelocity,
    [-2000, -200, 0, 200, 2000],
    [4, 0, 0, 0, 4],
  );
  const scrollBlur = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-screen shrink-0 overflow-hidden"
        style={{
          width: collapsed ? COLLAPSED : EXPANDED,
          transition: `width ${DURATION}ms ${EASE}`,
        }}
      >
        <aside className="flex h-screen w-full flex-col border-r border-solid border-sidebar-border bg-sidebar">
          <div
            ref={scrollRef}
            data-lenis-prevent
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-none px-[10px] pt-[9px] pb-3 mask-[linear-gradient(to_bottom,black_calc(100%-24px),transparent)] [&::-webkit-scrollbar]:hidden"
          >
            <div className="relative flex h-[33px] w-full items-center">
              <div
                className="relative h-[33px] w-[34px] shrink-0 overflow-hidden"
                style={fade(collapsed)}
                aria-hidden={collapsed}
              >
                <Image
                  src="/logo/static/logo.svg"
                  alt="pixel-perfect"
                  fill
                  priority
                  sizes="34px"
                  className="object-contain object-left dark:invert"
                />
              </div>
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="absolute right-1 top-[6px] z-10 flex size-5 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Open sidebar" : "Close sidebar"}
              >
                <HugeiconsIcon icon={SidebarLeft01Icon} size={20} strokeWidth={1.5} />
              </button>
            </div>

            <motion.nav
              className="flex w-full flex-col gap-4 will-change-[filter]"
              style={{ filter: scrollBlur }}
            >
              <Section title="BUILD" collapsed={collapsed}>
                {BUILD_ITEMS.map((item) => (
                  <NavRow
                    key={item.label}
                    item={item}
                    active={active === item.label}
                    collapsed={collapsed}
                    onClick={() => setActive(item.label)}
                  />
                ))}
              </Section>

              <Section title="MONITOR" collapsed={collapsed}>
                {MONITOR_ITEMS.map((item) => (
                  <NavRow
                    key={item.label}
                    item={item}
                    active={active === item.label}
                    collapsed={collapsed}
                    onClick={() => setActive(item.label)}
                  />
                ))}
              </Section>
            </motion.nav>
          </div>

          <div
            className="mx-[4px] mb-[4px] flex shrink-0 flex-col items-stretch overflow-hidden border border-solid border-sidebar-border bg-card px-[6px]"
            style={{
              gap: collapsed ? 0 : 2,
              paddingTop: collapsed ? 6 : 6,
              paddingBottom: collapsed ? 2 : 6,
              borderRadius: collapsed ? 12 : 18,
              transition: `border-radius ${DURATION}ms ${EASE}, gap ${DURATION}ms ${EASE}, padding-top ${DURATION}ms ${EASE}, padding-bottom ${DURATION}ms ${EASE}`,
            }}
          >
            {FOOTER_ITEMS.map((item) => (
              <CardRow
                key={item.label}
                item={item}
                active={active === item.label}
                collapsed={collapsed}
                onClick={() => setActive(item.label)}
              />
            ))}

            <div
              className="relative w-full"
              style={{
                height: 33,
                transition: `height ${DURATION}ms ${EASE}`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  opacity: collapsed ? 0 : 1,
                  pointerEvents: collapsed ? "none" : "auto",
                  transition: `opacity 150ms ${EASE}`,
                }}
                aria-hidden={collapsed}
              >
                <ThemeToggle theme={theme} onChange={setTheme} />
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: collapsed ? 1 : 0,
                  pointerEvents: collapsed ? "auto" : "none",
                  transition: `opacity 150ms ${EASE}`,
                }}
                aria-hidden={!collapsed}
              >
                <CompactThemeToggle theme={theme} onChange={setTheme} />
              </div>
            </div>

            <div
              className="flex w-full items-center gap-[11px] overflow-hidden"
              style={{
                paddingTop: collapsed ? -1 : 6,
                transition: `padding-top ${DURATION}ms ${EASE}`,
              }}
            >
              <div
                role="img"
                aria-label="Vansh Nagar"
                className="aspect-square shrink-0 rounded-full bg-cover bg-center bg-no-repeat"
                style={{
                  width: collapsed ? 29 : 47,
                  backgroundImage: "url(/sarj-avatar.jpg)",
                  transition: `width ${DURATION}ms ${EASE}`,
                }}
              />
              <div
                className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden text-[13px] font-medium"
                style={fade(collapsed)}
                aria-hidden={collapsed}
              >
                <span className="truncate text-foreground">Vansh Nagar</span>
                <span className="truncate text-muted-foreground">vNagar@sarj.ai</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-[6px]">
      <div
        className="flex w-full items-center justify-between overflow-hidden"
        style={{
          transition: `height ${DURATION}ms ${EASE}, opacity 150ms ${EASE}`,
          height: collapsed ? 0 : 12,
          opacity: collapsed ? 0 : 1,
        }}
        aria-hidden={collapsed}
      >
        <span className="whitespace-nowrap text-[10px] font-medium tracking-wide text-muted-foreground/70">
          {title}
        </span>
      </div>
      <div className="flex w-full flex-col gap-[2px]">{children}</div>
    </div>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={cn(
        "group flex w-full items-center gap-[6px] overflow-hidden py-[6px] pl-[8px] pr-[6px] transition-colors",
        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
      )}
      style={{
        borderRadius: collapsed ? 6 : 10,
        transition: `border-radius ${DURATION}ms ${EASE}, background-color 150ms ${EASE}`,
      }}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        <HugeiconsIcon
          icon={item.icon}
          size={16}
          strokeWidth={1.5}
          className={active ? "text-sidebar-accent-foreground" : "text-muted-foreground"}
        />
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate whitespace-nowrap text-left text-[13px] font-medium",
          active ? "text-sidebar-accent-foreground" : "text-muted-foreground",
        )}
        style={fade(collapsed)}
      >
        {item.label}
      </span>
      {item.trailing === "add" && (
        <span
          role="button"
          aria-label={`Add ${item.label}`}
          className="flex size-[21px] shrink-0 items-center justify-center rounded-[6px] border border-solid border-border bg-background text-muted-foreground"
          style={fade(collapsed)}
          aria-hidden={collapsed}
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            size={12}
            strokeWidth={2.5}
            className="transition-transform duration-300 ease-out group-hover:rotate-90"
          />
        </span>
      )}
    </button>
  );
}

function CardRow({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={cn(
        "flex w-full items-center gap-[6px] overflow-hidden px-[7.5px] py-[6px] transition-colors",
        active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
      )}
      style={{
        borderRadius: collapsed ? 6 : 10,
        transition: `border-radius ${DURATION}ms ${EASE}, background-color 150ms ${EASE}`,
      }}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        <HugeiconsIcon
          icon={item.icon}
          size={16}
          strokeWidth={1.5}
          className={active ? "text-sidebar-accent-foreground" : "text-muted-foreground"}
        />
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate whitespace-nowrap text-left text-[13px] font-medium",
          active ? "text-sidebar-accent-foreground" : "text-muted-foreground",
        )}
        style={fade(collapsed)}
      >
        {item.label}
      </span>
    </button>
  );
}

const THEME_OPTIONS: {
  key: Theme;
  label: string;
  icon: typeof Sun03Icon;
}[] = [
  { key: "light", label: "Light", icon: Sun03Icon },
  { key: "dark", label: "Dark", icon: Moon02Icon },
  { key: "system", label: "System", icon: ComputerIcon },
];

function ThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (next: Theme) => void;
}) {
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className="relative flex h-[33px] w-full min-w-0 items-center justify-between rounded-[10px] bg-muted p-[3px]"
    >
      {THEME_OPTIONS.map((opt) => {
        const active = theme === opt.key;
        return (
          <motion.button
            key={opt.key}
            layout
            type="button"
            onClick={() => onChange(opt.key)}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className={cn(
              "relative flex h-[27px] min-w-0 flex-1 basis-0 items-center justify-center text-[13px] font-medium outline-none focus-visible:outline-none",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-toggle-pill"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="absolute inset-0 rounded-[8px] bg-card shadow-[0_2px_2px_rgba(0,0,0,0.05),0_8px_4px_rgba(0,0,0,0.04),0_17px_5px_rgba(0,0,0,0.03)]"
              />
            )}
            <motion.span layout="position" className="relative">
              {opt.label}
            </motion.span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

function CompactThemeToggle({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (next: Theme) => void;
}) {
  const current = THEME_OPTIONS.find((o) => o.key === theme) ?? THEME_OPTIONS[0];
  const nextTheme: Record<Theme, Theme> = {
    light: "dark",
    dark: "system",
    system: "light",
  };
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={() => onChange(nextTheme[theme])}
      title={`Theme: ${current.label} (click to switch)`}
      aria-label={`Switch theme (current: ${current.label})`}
      className="flex size-[33px] cursor-pointer items-center justify-center rounded-[6px] text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ filter: "blur(1px)", scale: 1 }}
          animate={{ filter: "blur(0px)", scale: 1.2 }}
          exit={{ filter: "blur(1px)", scale: 0.8 }}
          transition={{ duration: 0.05 }}
        >
          <HugeiconsIcon icon={current.icon} size={13} strokeWidth={1.5} />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
