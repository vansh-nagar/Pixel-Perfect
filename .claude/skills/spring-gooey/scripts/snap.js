#!/usr/bin/env node
// Screenshot a component on the RUNNING dev server at rest, mid-animation, settled and
// leaving, in light and dark, and report console errors. Uses the repo's Playwright:
//
//   NODE_PATH=$PWD/node_modules node .claude/skills/spring-gooey/scripts/snap.js \
//     --url http://localhost:3001/blocks/buttons --page all --text "Antinomy Button" --up 2 --out /tmp/goo
//
// Options
//   --url <url>         page to open (required)
//   --text <label>      exact text that identifies the component's card/label
//   --up <n>            how many ancestors above --text to screenshot (grid cards: 2). Default 2
//   --selector <css>    alternative to --text: the element to screenshot
//   --hover <css>       element inside the target to hover. Default "button, [role=button], a, [role=switch]"
//   --page all|<n>      click pagination buttons (role=button, numeric name) until the target appears
//   --mid <ms>          delay before the mid-animation frame. Default 220
//   --settle <ms>       delay before the settled frame. Default 1200
//   --out <dir>         output directory. Default ./goo-snaps
//   --click             click instead of hover (toggles, press-driven effects)
const { chromium } = require("playwright");
const fs = require("node:fs");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true]);
    return acc;
  }, []),
);
if (!args.url || (!args.text && !args.selector)) {
  console.error("usage: snap.js --url <url> (--text <label> | --selector <css>) [--up 2] [--page all] [--out dir]");
  process.exit(2);
}
const out = args.out || "./goo-snaps";
const up = Number(args.up ?? 2);
const mid = Number(args.mid ?? 220);
const settle = Number(args.settle ?? 1200);
const hoverSel = args.hover || "button, [role=button], a, [role=switch]";
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2, colorScheme: theme });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(args.url, { waitUntil: "networkidle", timeout: 120000 });
    await page.evaluate((t) => document.documentElement.classList.toggle("dark", t === "dark"), theme);

    const find = () => args.selector
      ? page.locator(args.selector).first()
      : page.getByText(args.text, { exact: true }).first().locator(`xpath=${Array(up).fill("..").join("/") || "."}`);

    let target = find();
    if (args.page) {
      const pages = page.getByRole("button", { name: /^\d+$/ });
      const n = await pages.count();
      const order = args.page === "all" ? [...Array(n).keys()] : [Number(args.page) - 1];
      for (const i of order) {
        if (i < 0 || i >= n) continue;
        await pages.nth(i).click();
        await page.waitForTimeout(300);
        target = find();
        if (await target.count()) break;
      }
    }
    if (!(await target.count())) { console.log(theme, "target not found"); await ctx.close(); continue; }

    await target.scrollIntoViewIfNeeded();
    await page.mouse.move(2, 2);
    await page.waitForTimeout(400);
    await target.screenshot({ path: `${out}/${theme}-rest.png` });

    const el = target.locator(hoverSel).first();
    const hasEl = await el.count();
    if (hasEl) {
      if (args.click) await el.click(); else await el.hover();
      await page.waitForTimeout(mid);
      await target.screenshot({ path: `${out}/${theme}-mid.png` });
      await page.waitForTimeout(settle);
      await target.screenshot({ path: `${out}/${theme}-settled.png` });
      if (args.click) await el.click(); else await page.mouse.move(2, 2);
      await page.waitForTimeout(120);
      await target.screenshot({ path: `${out}/${theme}-leaving.png` });
    } else {
      console.log(theme, "no hover target matched", hoverSel);
    }
    console.log(theme, "→", out, "| console errors:", errors.length ? errors : "none");
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
