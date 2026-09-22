#!/usr/bin/env node
// Screenshot the abstract-art board on the RUNNING dev server at several moments
// in the loop, and report console errors and frame timing. Uses the repo's Playwright:
//
//   node .claude/skills/abstract/scripts/snap.mjs --url http://localhost:3001/playground \
//     --scene "Metro" --at 1200,2400,3600 --out /tmp/abstract
//
// Options
//   --url <url>      page to open (required) — find the running server in .next/dev/lock
//   --scene <name>   one tile's name (its data-scene attribute). Default: the whole board
//   --at <ms,...>    moments after load to capture. Default 1200,2400,3600
//   --out <dir>      output directory. Default ./abstract-snaps
//   --width <px>     viewport width. Default 1440
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Resolve Playwright from the project, not from this script's folder.
const require = createRequire(path.join(process.cwd(), "package.json"));
const { chromium } = require("playwright");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]);
    return acc;
  }, []),
);
if (!args.url) {
  console.error('usage: snap.mjs --url <url> [--scene "Name"] [--at 1200,2400,3600] [--out dir]');
  process.exit(2);
}
const out = args.out || "./abstract-snaps";
const moments = String(args.at || "1200,2400,3600").split(",").map(Number).sort((a, b) => a - b);
const slug = args.scene ? String(args.scene).toLowerCase().replace(/[^a-z0-9]+/g, "-") : "board";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(args.width || 1440), height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto(String(args.url), { waitUntil: "networkidle", timeout: 120000 });

const target = args.scene ? page.locator(`[data-scene="${args.scene}"]`).first() : page.locator("main").first();
if (!(await target.count())) {
  console.error(`no element found for ${args.scene ? `[data-scene="${args.scene}"]` : "main"}`);
  await browser.close();
  process.exit(1);
}
await target.scrollIntoViewIfNeeded();

let waited = 0;
for (const ms of moments) {
  await page.waitForTimeout(Math.max(0, ms - waited));
  waited = ms;
  const file = path.join(out, `${slug}-${ms}.png`);
  await target.screenshot({ path: file });
  console.log("saved", file);
}

// Three seconds of requestAnimationFrame deltas with everything on screen animating.
const deltas = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const list = [];
      let last = performance.now();
      const start = last;
      const tick = (now) => {
        list.push(now - last);
        last = now;
        if (now - start < 3000) requestAnimationFrame(tick);
        else resolve(list);
      };
      requestAnimationFrame(tick);
    }),
);
deltas.sort((a, b) => a - b);
const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
console.log(`frame ms  avg ${avg.toFixed(1)}  p95 ${deltas[Math.floor(deltas.length * 0.95)].toFixed(1)}  (16.7 = 60fps)`);
console.log(errors.length ? `console errors:\n  ${errors.slice(0, 10).join("\n  ")}` : "console errors: none");
await browser.close();
