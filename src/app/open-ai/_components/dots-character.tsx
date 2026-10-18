"use client";

/**
 * The dots hero artwork: the 3D stage plus the swap logic around it.
 *
 * Starts on the logo "O". While the artwork is at least half on screen, every 3 s of
 * idle time (no pointer move, click or key press) it spins to the next character:
 * O → Alfred → Felipe → Iggy → Todd → O. Clicking swaps immediately and stops the
 * auto-cycle, like the original.
 *
 * Differences from openai.com: no intro video of the logo (the stage starts on the 3D
 * "O"), and scrolling does not lock the cycle, because this section sits below the fold.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { nextSelectable, type SelectableName } from "./dots/characters";
import styles from "./dots/dots.module.css";
import { DotsStage } from "./dots/stage";

const SWAP_INTERVAL_MS = 3000;

export function DotsCharacter() {
  const [selected, setSelected] = useState<SelectableName>("O");
  const [locked, setLocked] = useState(false);
  const [playIntro, setPlayIntro] = useState(false);
  const [animateSelection, setAnimateSelection] = useState(true);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const artwork = useRef<HTMLDivElement>(null);
  const revealed = useRef<SelectableName>("O");
  const idleSince = useRef<number | null>(null);

  const onReveal = useCallback((name: SelectableName) => {
    revealed.current = name;
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const advance = useCallback(() => {
    setPlayIntro(true);
    setSelected(nextSelectable);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const update = () => setContinuous(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = artwork.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5), {
      threshold: 0.5,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Idle auto-swap: any pointer move, click or key press restarts the 3 s countdown.
  useEffect(() => {
    if (locked || !continuous || !inView) {
      idleSince.current = null;
      return;
    }
    if (idleSince.current === null) idleSince.current = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      if (document.hidden || !ready) return;
      timer = setTimeout(
        () => {
          idleSince.current = performance.now();
          advance();
          schedule();
        },
        Math.max(0, (idleSince.current ?? performance.now()) + SWAP_INTERVAL_MS - performance.now()),
      );
    };
    const reset = () => {
      idleSince.current = performance.now();
      schedule();
    };
    schedule();
    window.addEventListener("pointermove", reset, { passive: true });
    window.addEventListener("pointerdown", reset, { passive: true });
    window.addEventListener("keydown", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", reset);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [locked, continuous, inView, ready, advance]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24">
      <div ref={artwork} className={styles.artwork} data-selected-character={selected} data-auto-swap={locked ? "locked" : "enabled"}>
        <div className={styles.stage}>
          <div className={styles.scene}>
            <DotsStage
              className={styles.renderSurface}
              label="A dots character"
              selected={selected}
              playIntro={playIntro}
              animateSelection={animateSelection}
              continuous={continuous}
              onReveal={onReveal}
              onReady={onReady}
            />
          </div>
        </div>
        <button
          type="button"
          className={styles.button}
          aria-label="Switch character"
          onClick={() => {
            setLocked(true);
            setAnimateSelection(true);
            advance();
          }}
        />
      </div>
      <p className="text-sm text-white/50">dots — click to switch, or stay idle for 3 s</p>
    </div>
  );
}
