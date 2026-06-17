"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { ButtonsArr } from "@/components/mine/grids/button-grid";

/* ---------------------------------------------------------------------------
 * Button physics sandbox.
 *
 * Random buttons from the button grid drop in and behave like real rigid
 * bodies: gravity pulls them down, they bounce off the walls + the footer
 * (the floor), and they collide with each other (AABB) so they pile up. A tiny
 * hand-rolled solver runs the simulation; GSAP's ticker drives the loop and
 * `gsap.set` writes each body's transform every frame.
 * ------------------------------------------------------------------------- */

// Skip the grid entries that ship with a variant/mode <Select> dropdown — we
// only want plain buttons falling, not a dropdown riding along with them.
const DROPDOWN_BUTTONS = new Set([
  "Magnetic Button",
  "3D Button",
  "Premium Button",
  "Orange Premium Button",
  "Blue Chrome Button",
  "Metal Button",
  "Glass Button",
  "Master Button",
  "Glassy Button",
  "Book a Demo Button",
]);
const BUTTONS = ButtonsArr.filter((b) => !DROPDOWN_BUTTONS.has(b.name));

const FOOTER_H = 76; // px — the footer is the floor
const GRAVITY = 2800; // px/s²
const RESTITUTION = 0.45; // bounciness off walls/floor
const WALL_FRICTION = 0.8; // horizontal damping on floor contact
const MAX_BODIES = 40;
const ITERATIONS = 6; // collision-resolve passes per frame (stack stability)

type Body = {
  id: number;
  el: HTMLDivElement;
  x: number; // center
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
};

type Item = { id: number; idx: number };

const Page = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const bodies = useRef<Map<number, Body>>(new Map());
  const bounds = useRef({ w: 0, h: 0 });
  const nextId = useRef(0);
  // grab-to-throw: which body is held + the cursor position (scene coords)
  const held = useRef<{ id: number; offX: number; offY: number } | null>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const [items, setItems] = useState<Item[]>([]);

  // Register/measure a freshly-mounted body element and seed its physics.
  const register = (item: Item) => (el: HTMLDivElement | null) => {
    if (!el) {
      bodies.current.delete(item.id);
      return;
    }
    if (bodies.current.has(item.id)) return;
    const w = el.offsetWidth || 120;
    const h = el.offsetHeight || 44;
    const W = bounds.current.w || window.innerWidth;
    // spawn within a central band so bodies overlap and pile on each other
    const x = Math.max(
      w / 2,
      Math.min(W - w / 2, W / 2 + (Math.random() - 0.5) * W * 0.45),
    );
    const body: Body = {
      id: item.id,
      el,
      x,
      y: -h - Math.random() * 200, // start above the top, staggered
      w,
      h,
      vx: (Math.random() - 0.5) * 240,
      vy: 0,
      rot: 0,
    };
    bodies.current.set(item.id, body);
    gsap.set(el, { x: x - w / 2, y: body.y - h / 2, opacity: 1 });
  };

  // Pick up a body: remember the grab offset so it doesn't snap to the cursor.
  const grab = (e: React.PointerEvent<HTMLDivElement>, id: number) => {
    const b = bodies.current.get(id);
    const scene = sceneRef.current;
    if (!b || !scene) return;
    e.preventDefault();
    const r = scene.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    pointer.current = { x: px, y: py };
    held.current = { id, offX: px - b.x, offY: py - b.y };
  };

  const drop = (n = 1) =>
    setItems((prev) => {
      const room = Math.max(0, MAX_BODIES - prev.length);
      const add = Array.from({ length: Math.min(n, room) }, () => ({
        id: nextId.current++,
        idx: Math.floor(Math.random() * BUTTONS.length),
      }));
      return [...prev, ...add];
    });

  const clear = () => {
    bodies.current.clear();
    setItems([]);
  };

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const measure = () => {
      bounds.current = { w: scene.clientWidth, h: scene.clientHeight };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(scene);

    const onPointerMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onPointerUp = () => {
      held.current = null; // release → the body keeps its last velocity (throw)
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // one physics substep — integrate the free bodies then resolve overlaps.
    // The held body is kinematic (positioned from the cursor in `update`), so we
    // skip gravity/walls for it and let it shove everything else fully.
    const step = (dt: number, h: typeof held.current) => {
      const { w: W, h: H } = bounds.current;
      const floorY = H - FOOTER_H;
      const list = [...bodies.current.values()];

      // integrate
      for (const b of list) {
        if (h && b.id === h.id) continue;
        b.vy += GRAVITY * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }

      // resolve collisions + walls/floor over a few passes for stable stacks
      for (let it = 0; it < ITERATIONS; it++) {
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const c = list[j];
            const dx = c.x - a.x;
            const dy = c.y - a.y;
            const ox = (a.w + c.w) / 2 - Math.abs(dx);
            const oy = (a.h + c.h) / 2 - Math.abs(dy);
            if (ox <= 0 || oy <= 0) continue;
            // a held body is immovable — it shoves the other one fully.
            const aHeld = !!h && a.id === h.id;
            const cHeld = !!h && c.id === h.id;
            if (ox < oy) {
              const s = dx < 0 ? -1 : 1;
              if (aHeld) {
                c.x += s * ox;
                c.vx = a.vx;
              } else if (cHeld) {
                a.x -= s * ox;
                a.vx = c.vx;
              } else {
                a.x -= (s * ox) / 2;
                c.x += (s * ox) / 2;
                if ((c.vx - a.vx) * s < 0) {
                  const m = (a.vx + c.vx) / 2;
                  a.vx = m;
                  c.vx = m;
                }
              }
            } else {
              const s = dy < 0 ? -1 : 1;
              if (aHeld) {
                c.y += s * oy;
                c.vy = a.vy * RESTITUTION;
              } else if (cHeld) {
                a.y -= s * oy;
                a.vy = c.vy * RESTITUTION;
              } else {
                a.y -= (s * oy) / 2;
                c.y += (s * oy) / 2;
                if ((c.vy - a.vy) * s < 0) {
                  const m = (a.vy + c.vy) / 2;
                  a.vy = m * RESTITUTION;
                  c.vy = m * RESTITUTION;
                }
              }
            }
          }
        }
        // walls + floor (skip the held body so it can be dragged anywhere)
        for (const b of list) {
          if (h && b.id === h.id) continue;
          if (b.x - b.w / 2 < 0) {
            b.x = b.w / 2;
            b.vx = Math.abs(b.vx) * RESTITUTION;
          } else if (b.x + b.w / 2 > W) {
            b.x = W - b.w / 2;
            b.vx = -Math.abs(b.vx) * RESTITUTION;
          }
          if (b.y + b.h / 2 > floorY) {
            b.y = floorY - b.h / 2;
            if (b.vy > 0) b.vy *= -RESTITUTION;
            if (Math.abs(b.vy) < 25) b.vy = 0;
            b.vx *= WALL_FRICTION;
          }
        }
      }

    };

    // commit transforms once per frame (lean slightly toward travel direction)
    const render = () => {
      for (const b of bodies.current.values()) {
        const targetRot = Math.max(-9, Math.min(9, b.vx * 0.02));
        b.rot += (targetRot - b.rot) * 0.2;
        gsap.set(b.el, {
          x: b.x - b.w / 2,
          y: b.y - b.h / 2,
          rotation: b.rot,
        });
      }
    };

    const SUBSTEPS = 5; // split the frame so fast bodies can't tunnel through
    const update = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 1 / 30);
      const h = held.current;

      // re-measure (some buttons finish laying out a frame after mount)
      for (const b of bodies.current.values()) {
        b.w = b.el.offsetWidth || b.w;
        b.h = b.el.offsetHeight || b.h;
      }

      // drive the held body from the cursor once per frame so its velocity
      // (and thus its throw momentum + the shove it gives others) is correct.
      if (h) {
        const b = bodies.current.get(h.id);
        if (b) {
          const tx = pointer.current.x - h.offX;
          const ty = pointer.current.y - h.offY;
          const clamp = (v: number) => Math.max(-4500, Math.min(4500, v));
          b.vx = clamp((tx - b.x) / dt);
          b.vy = clamp((ty - b.y) / dt);
          b.x = tx;
          b.y = ty;
        }
      }

      for (let s = 0; s < SUBSTEPS; s++) step(dt / SUBSTEPS, h);
      render();
    };
    gsap.ticker.add(update);

    // seed a few on mount
    const seed = gsap.delayedCall(0.2, () => drop(6));

    return () => {
      gsap.ticker.remove(update);
      seed.kill();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className="relative h-screen w-screen overflow-hidden bg-background select-none"
    >
      {/* falling bodies */}
      {items.map((item) => (
        <div
          key={item.id}
          ref={register(item)}
          onPointerDown={(e) => grab(e, item.id)}
          className="absolute left-0 top-0 cursor-grab opacity-0 active:cursor-grabbing"
          style={{ willChange: "transform", touchAction: "none" }}
        >
          {BUTTONS[item.idx].component}
        </div>
      ))}

      {/* footer = the floor + controls */}
      <div
        className="absolute inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-border bg-card/80 px-6 backdrop-blur"
        style={{ height: FOOTER_H }}
      >
        <span className="text-xs font-semibold tracking-widest text-muted-foreground">
          BUTTON PHYSICS · {items.length}/{MAX_BODIES}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => drop(1)}>
            Drop
          </Button>
          <Button size="sm" variant="outline" onClick={() => drop(10)}>
            Drop 10
          </Button>
          <Button size="sm" variant="ghost" onClick={clear}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
