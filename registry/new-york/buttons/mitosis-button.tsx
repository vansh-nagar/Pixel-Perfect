"use client";
/**
 * Share pill that buds gooey drops from its underside on hover, which stretch, split apart and settle into a row of icon buttons.
 */
import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link2, Mail, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// Choreography: the pill is one gooey shape and every action is a drop parked inside it. On hover
// (or a click, tap or Enter, which pins it open) the drops leave through the pill's underside on a
// liquid spring, the middle one first and its neighbours 50ms later, so for the first ~150ms they
// hang off the pill as one lobed blob. Each drop drags a tail that follows half-way while it
// shrinks on a slow-start ease; that is what stretches the neck before it snaps. Settled, the drops
// sit 8px apart, far enough that the goo lets go and they read as separate buttons. On leave they
// fall back on a heavier spring that doesn't bounce and the pill swallows them. Icons ride above
// the goo and fade in once their drop has pinched off. Safari skips the filter (its SVG-filter-on-
// HTML repaints are unreliable), leaving a pill and plain circles.

export type MitosisVariant = "solid" | "subtle";
export type MitosisSize = "sm" | "default" | "lg";

export interface MitosisItem {
  /** Accessible name of the action. */
  label: string;
  icon: React.ReactNode;
  onSelect?: () => void;
}

export interface MitosisButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Actions that bud out of the pill. */
  items?: MitosisItem[];
  /** `solid` fills the shapes with the foreground and inverts the text; `subtle` only tints them like the muted surface. */
  variant?: MitosisVariant;
  size?: MitosisSize;
}

const defaultItems: MitosisItem[] = [
  { label: "Copy link", icon: <Link2 /> },
  { label: "Email", icon: <Mail /> },
  { label: "Send", icon: <Send /> },
];

const sizePx: Record<MitosisSize, number> = { sm: 13, default: 14, lg: 16 };
const ease = [0.19, 1, 0.22, 1] as const;
const slowStart = [0.65, 0, 0.35, 1] as const;
const bud = { type: "spring", stiffness: 266, damping: 17, mass: 1 } as const;
const swallow = { type: "spring", stiffness: 220, damping: 24, mass: 1 } as const;

const MitosisButton = React.forwardRef<HTMLButtonElement, MitosisButtonProps>(
  (
    {
      children = "Share",
      items = defaultItems,
      variant = "solid",
      size = "default",
      className,
      style,
      disabled,
      onClick,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const [hovered, setHovered] = React.useState(false);
    const [pinned, setPinned] = React.useState(false);
    const root = React.useRef<HTMLDivElement>(null);
    const trigger = React.useRef<HTMLButtonElement>(null);
    const leaveTimer = React.useRef<number | undefined>(undefined);
    const reducedMotion = useReducedMotion();
    const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");
    const gooId = `mitosis-goo-${id}`;
    const menuId = `mitosis-menu-${id}`;

    React.useImperativeHandle(ref, () => trigger.current as HTMLButtonElement);

    const open = !disabled && (hovered || pinned);
    const solid = variant === "solid";
    const fontSize = sizePx[size];
    const unit = fontSize / 14;
    const pill = 28 * unit; // pill height, and the diameter of every drop
    const gap = 8 * unit; // between drops, and between the pill and the row: wide enough to split
    const pad = 20 * unit; // ≥ 3σ + spring overshoot, so the blur never reaches the layer edge
    const middle = (items.length - 1) / 2;
    const reach = middle * (pill + gap) + pill / 2 + pad; // horizontal room either side of the centre

    // Close on a short delay so the pointer can cross the gap between the pill and the drops.
    React.useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

    React.useEffect(() => {
      if (!pinned) return;
      const onPointerDown = (event: PointerEvent) => {
        if (!root.current?.contains(event.target as Node)) setPinned(false);
      };
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [pinned]);

    const target = (index: number) => ({
      x: (index - middle) * (pill + gap),
      y: pill + gap,
    });
    const delay = (index: number) => Math.abs(index - middle) * 0.05;
    const dropTransition = (index: number) =>
      reducedMotion
        ? { duration: 0 }
        : open
          ? { ...bud, delay: delay(index) }
          : swallow;
    const dropStyle = {
      width: pill,
      height: pill,
      marginLeft: -pill / 2,
      marginTop: -pill / 2,
    };

    return (
      <div
        ref={root}
        className={cn(
          "relative isolate inline-flex",
          disabled && "opacity-50",
          className,
        )}
        style={{ fontSize, ...style }}
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          window.clearTimeout(leaveTimer.current);
          setHovered(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "touch") return;
          window.clearTimeout(leaveTimer.current);
          leaveTimer.current = window.setTimeout(() => setHovered(false), 120);
        }}
        onBlur={(event) => {
          if (!root.current?.contains(event.relatedTarget as Node)) setPinned(false);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !open) return;
          setPinned(false);
          setHovered(false);
          trigger.current?.focus();
        }}
      >
        {/* Gooey filter: blur, then push alpha to 0 or 1 so the pill and drops read as one liquid. */}
        <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0">
          <defs>
            <filter id={gooId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2.5 * unit} result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              />
            </filter>
          </defs>
        </svg>

        {/* Filtered layer: shapes only. It overhangs the pill by `pad` and reaches below the row
            of drops, so nothing the blur touches is ever cut flat. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute filter-(--goo) supports-[-webkit-hyphens:none]:filter-none",
            solid ? "opacity-100" : "opacity-[0.08]",
          )}
          style={
            {
              top: -pad,
              bottom: -(gap + pill + pad),
              left: -reach,
              right: -reach,
              "--goo": `url(#${gooId})`,
            } as React.CSSProperties
          }
        >
          <span
            className="absolute rounded-full bg-foreground"
            style={{ top: pad, left: reach, right: reach, height: pill }}
          />
          <span className="absolute left-1/2 size-0" style={{ top: pad + pill / 2 }}>
            {items.map((item, index) => {
              const { x, y } = target(index);
              return (
                <React.Fragment key={item.label}>
                  {/* Tail: re-spawns inside the pill on every open and trails the drop half-way
                      while it shrinks, so the neck stretches before it breaks. */}
                  <motion.span
                    className="absolute left-0 top-0 rounded-full bg-foreground"
                    style={dropStyle}
                    initial={false}
                    animate={
                      open && !reducedMotion
                        ? { x: [0, x * 0.5], y: [0, y * 0.5], scale: [0.9, 0] }
                        : { x: 0, y: 0, scale: 0 }
                    }
                    transition={
                      open && !reducedMotion
                        ? {
                            duration: 0.4,
                            delay: delay(index),
                            ease,
                            scale: { duration: 0.4, delay: delay(index), ease: slowStart },
                          }
                        : { duration: 0 }
                    }
                  />
                  <motion.span
                    className="absolute left-0 top-0 rounded-full bg-foreground"
                    style={dropStyle}
                    initial={false}
                    animate={{
                      x: open ? x : 0,
                      y: open ? y : 0,
                      scale: open ? 1 : 0.6,
                    }}
                    transition={dropTransition(index)}
                  />
                </React.Fragment>
              );
            })}
          </span>
        </span>

        <button
          {...props}
          ref={trigger}
          type={type}
          disabled={disabled}
          aria-expanded={open}
          aria-controls={menuId}
          className={cn(
            "relative z-10 inline-flex h-[2em] cursor-pointer select-none items-center whitespace-nowrap rounded-full border-0 bg-transparent px-[0.9em] font-medium leading-none outline-none [-webkit-tap-highlight-color:transparent]",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none",
            solid ? "text-background" : "text-foreground",
          )}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) setPinned((value) => !value);
          }}
        >
          {children}
        </button>

        {/* The actions: real buttons riding the same springs as their drops, never filtered. */}
        <div
          id={menuId}
          role="group"
          aria-label={typeof children === "string" ? children : undefined}
          inert={!open}
          className="absolute left-1/2 top-1/2 z-20 size-0"
        >
          {items.map((item, index) => {
            const { x, y } = target(index);
            return (
              <motion.button
                key={item.label}
                type="button"
                aria-label={item.label}
                className={cn(
                  "absolute left-0 top-0 grid cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 outline-none [-webkit-tap-highlight-color:transparent]",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  solid ? "text-background" : "text-foreground",
                  !open && "pointer-events-none",
                )}
                style={dropStyle}
                initial={false}
                animate={{
                  x: open ? x : 0,
                  y: open ? y : 0,
                  scale: open ? 1 : 0.6,
                }}
                transition={dropTransition(index)}
                onClick={() => {
                  item.onSelect?.();
                  setPinned(false);
                }}
              >
                <motion.span
                  className="grid place-items-center [&_svg]:size-[1.05em]"
                  initial={false}
                  animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.4 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : open
                        ? { duration: 0.3, ease, delay: delay(index) + 0.16 }
                        : { duration: 0.1 }
                  }
                >
                  {item.icon}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  },
);

MitosisButton.displayName = "MitosisButton";

export default MitosisButton;
