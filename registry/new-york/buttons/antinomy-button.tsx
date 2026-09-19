"use client";
/**
 * Text label that slides right on hover as two gooey pills bloom and merge behind an action word, in subtle and solid variants.
 */
import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

// Motion is reverse-engineered from the i-D project label on antinomy.studio: the first pill
// springs open (stiffness 266, damping 15, mass 1) while the second eases in over 800ms and out
// over 400ms, and the pills fuse through a gooey filter. Proportions are 14px type on a 28px pill
// and scale in em from `size`. Colours come from the theme tokens so both modes work, keyboard
// focus reveals the action, reduced motion snaps to the final state, and Safari skips the filter
// (its SVG-filter-on-HTML repaints are unreliable), leaving two plain pills.

export type AntinomyVariant = "solid" | "subtle";
export type AntinomySize = "sm" | "default" | "lg";

export interface AntinomyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Action word revealed on hover or keyboard focus. */
  revealLabel?: React.ReactNode;
  /** `solid` fills the pills with the foreground and inverts the text; `subtle` only tints them like the muted surface. */
  variant?: AntinomyVariant;
  size?: AntinomySize;
}

const ease = [0.19, 1, 0.22, 1] as const;
const sizePx: Record<AntinomySize, number> = { sm: 13, default: 14, lg: 16 };
const pill =
  "inline-flex h-[2em] flex-none items-center justify-center whitespace-nowrap px-[0.85em] transition-colors duration-300 ease-out";

const AntinomyButton = React.forwardRef<HTMLButtonElement, AntinomyButtonProps>(
  (
    {
      children = "Case Study",
      revealLabel = "View",
      variant = "solid",
      size = "default",
      className,
      style,
      disabled,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const [hovered, setHovered] = React.useState(false);
    const [focused, setFocused] = React.useState(false);
    const [widths, setWidths] = React.useState<[number, number]>([0, 0]);
    const measure = React.useRef<HTMLSpanElement>(null);
    const reducedMotion = useReducedMotion();
    const gooId = `antinomy-goo-${React.useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

    const active = !disabled && (hovered || focused);
    const solid = variant === "solid";
    const fontSize = sizePx[size];
    const unit = fontSize / 14;
    const offset = 20 * unit; // room around the pills so the blur has space to fuse
    const shift = 10 * unit; // how far the label travels when the action word slides in

    React.useLayoutEffect(() => {
      const element = measure.current;
      if (!element) return;
      const update = () => {
        const [first, second] = Array.from(element.children);
        setWidths([
          first.getBoundingClientRect().width,
          second.getBoundingClientRect().width,
        ]);
      };
      update();
      const observer = new ResizeObserver(update);
      observer.observe(element);
      return () => observer.disconnect();
    }, [children, revealLabel, size]);

    const transition = reducedMotion
      ? { duration: 0 }
      : { duration: 0.4, ease };

    const labelColor = solid
      ? active
        ? "text-background delay-100"
        : "text-foreground"
      : active
        ? "text-foreground"
        : "text-muted-foreground";
    const revealColor = solid ? "text-background" : "text-foreground";

    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled}
        aria-label={
          props["aria-label"] ??
          (typeof children === "string" && typeof revealLabel === "string"
            ? `${revealLabel} ${children}`
            : undefined)
        }
        className={cn(
          "relative isolate inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 text-left font-medium leading-none text-foreground outline-none [-webkit-tap-highlight-color:transparent]",
          "focus-visible:rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        style={{ fontSize, ...style }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (event.pointerType !== "touch") setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          setHovered(false);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          setFocused(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setFocused(false);
        }}
      >
        {/* Gooey filter: blur, then push alpha to 0 or 1 so the blurred pills read as one shape. */}
        <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute size-0">
          <defs>
            <filter id={gooId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={2 * unit} result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              />
            </filter>
          </defs>
        </svg>

        {/* Stage: padded so the blur has room, then pulled back with negative margins so the
            button's box matches the revealed pills. At rest the label's ink sits on the box edge. */}
        <span
          className="relative inline-flex"
          style={{
            padding: offset,
            margin: -offset,
            marginLeft: -offset - shift,
            marginRight: -offset + shift,
          }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 [filter:var(--goo)] supports-[-webkit-hyphens:none]:[filter:none]",
              solid ? "opacity-100" : "opacity-[0.08]",
            )}
            style={{ "--goo": `url(#${gooId})` } as React.CSSProperties}
          >
            {widths.map((width, index) => (
              <motion.span
                key={index}
                className="absolute h-[2em] rounded-full bg-foreground"
                style={{ top: offset, left: offset }}
                initial={false}
                animate={{
                  width: active ? width : 0,
                  opacity: active ? 1 : 0,
                  x: active
                    ? shift + (index === 1 ? widths[0] : 0)
                    : (index === 0 ? shift : 0) + width / 2,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : index === 0
                      ? { type: "spring", stiffness: 266, damping: 15, mass: 1 }
                      : { duration: active ? 0.8 : 0.4, ease }
                }
              />
            ))}
          </span>

          {/* Visible labels. The action word mounts on activation and the main label shifts over. */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center"
            style={{ padding: offset }}
            initial={false}
            animate={{ x: active ? shift : 0 }}
            transition={transition}
          >
            {active && (
              <motion.span
                key="reveal"
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={transition}
                className={cn(pill, revealColor)}
              >
                {revealLabel}
              </motion.span>
            )}
            <motion.span
              key="label"
              layout="position"
              transition={transition}
              className={cn(pill, labelColor)}
            >
              {children}
            </motion.span>
          </motion.span>

          {/* Hidden copy that sizes the stage and feeds pill widths to the ResizeObserver. */}
          <span
            ref={measure}
            aria-hidden="true"
            className="pointer-events-none invisible flex"
          >
            <span className={pill}>{revealLabel}</span>
            <span className={pill}>{children}</span>
          </span>
        </span>
      </button>
    );
  },
);

AntinomyButton.displayName = "AntinomyButton";

export default AntinomyButton;
