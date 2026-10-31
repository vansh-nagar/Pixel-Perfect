// Inlines the isometric illustrations in public/illustrations/ into src/app/isometric/art/*-svg.ts for the
// /isometric page, each split into stacked layers. Run after regenerating any SVG:
//   node scripts/illustrations-svg.mjs
//
// Why layers: one big SVG repaints entirely (masks, clips, every stroke and legend) on each frame that ANY
// part moves. Each layer is its own <div><svg> with the same viewBox, stacked in painter's order. Static
// layers paint once and are composited; only a layer whose contents move is repainted; whole-layer moves
// (entrances, a cable sliding in) are compositor-only transforms on the div.
//
// Why scoping: all the illustrations share one document, and each one's <style> uses the same `.ill …`
// selectors with different values (`.key.down` presses a different distance on each). Every `.ill` selector is
// rewritten to `.ill-<name>`, and every clip/mask id gets a `<name>-` prefix so url(#…) refs can't collide.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const OUT = "src/app/isometric/art";

// painter's order; `live` layers receive pointer events
const ILLUSTRATIONS = [
  {
    name: "keyboard",
    file: "keyboard-iso.svg",
    layers: [
      { name: "cable", ids: ["cable"] },
      { name: "base", ids: ["switch", "case", "well"] },
      { name: "keys", ids: ["keys"], live: true },
      { name: "rim-right", ids: ["case-right"] },
      { name: "controls", ids: ["knob-top", "knob-bottom", "display"], live: true },
      { name: "keys-front", ids: ["keys-front"], live: true },
      { name: "rim-front", ids: ["case-front"] },
    ],
  },
  {
    name: "macropad",
    file: "macropad-iso.svg",
    layers: [
      { name: "cable", ids: ["cable", "plug"] },
      { name: "base", ids: ["base", "well", "ribbon", "connector"] },
      { name: "display", ids: ["display"] },
      { name: "keys", ids: ["keys", "switch", "key-3"], live: true },
      { name: "rims", ids: ["base-right", "base-front"] },
    ],
  },
  {
    name: "register",
    file: "register-iso.svg",
    layers: [
      { name: "base", ids: ["feet", "plinth", "body"] },
      { name: "keys", ids: ["keypad"], live: true },
      { name: "top", ids: ["badge", "slot"] },
      { name: "receipt", ids: ["receipt"] },
      { name: "drawer", ids: ["drawer"] },
    ],
  },
  {
    name: "computer",
    file: "computer-iso.svg",
    layers: [
      { name: "back", ids: ["plant", "case"], live: true },
      { name: "floppy", ids: ["floppy"] },
      { name: "stand", ids: ["stand"] },
      { name: "head", ids: ["head"] },
      { name: "front", ids: ["cable", "mouse"], live: true },
    ],
  },
  {
    name: "tower",
    file: "tower-iso.svg",
    layers: [
      { name: "ground", ids: ["rock", "island", "grove", "cauldron"] },
      { name: "floors", ids: ["floor-base", "floor-mid", "floor-top", "floor-hat"] },
      { name: "front", ids: ["mushrooms", "stones"] },
      { name: "hits", ids: ["hits"], live: true },
    ],
  },

];

function build({ name, file, layers }) {
  let svg = readFileSync(`public/illustrations/${file}`, "utf8").trim();

  // prefix every id that is referenced through url(#…) or href="#…"
  const refd = new Set([...svg.matchAll(/url\(#([\w-]+)\)|href="#([\w-]+)"/g)].map((m) => m[1] ?? m[2]));
  for (const id of refd) {
    svg = svg
      .replaceAll(`id="${id}"`, `id="${name}-${id}"`)
      .replaceAll(`url(#${id})`, `url(#${name}-${id})`)
      .replaceAll(`href="#${id}"`, `href="#${name}-${id}"`);
  }

  const lines = svg.split("\n");
  const openEnd = lines.findIndex((l) => l.trimEnd().endsWith(">"));
  const openTag = lines.slice(0, openEnd + 1).join("\n");
  const label = openTag.match(/aria-label="([^"]*)"/)?.[1] ?? name;
  const viewBox = openTag.match(/viewBox="([^"]*)"/)[1];
  const scope = `ill-${name}`;
  const style = svg
    .slice(svg.indexOf("<style>"), svg.indexOf("</style>") + "</style>".length)
    .replace(/(?<![\w-])\.ill(?![\w-])/g, `.${scope}`);

  // top-level groups: "  <g id=…" … "  </g>" at two-space indent
  const groups = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^ {2}<g id="([^"]+)"/);
    if (!m) continue;
    let j = i;
    while (lines[j] !== "  </g>") j++;
    groups.set(m[1], lines.slice(i, j + 1).join("\n"));
    i = j;
  }
  // root-level <defs> (clip paths shared by several groups) go into the first layer: url(#…) refs resolve
  // across the whole document, so the other layer SVGs can still use them
  const defsStart = lines.findIndex((l) => l === "  <defs>");
  const rootDefs = defsStart < 0 ? "" : lines.slice(defsStart, lines.indexOf("  </defs>", defsStart) + 1).join("\n");

  const used = layers.flatMap((l) => l.ids);
  const missing = [...groups.keys()].filter((id) => !used.includes(id));
  if (missing.length) throw new Error(`${name}: top-level groups not assigned to a layer: ${missing.join(", ")}`);
  const unknown = used.filter((id) => !groups.has(id));
  if (unknown.length) throw new Error(`${name}: layer ids not found in ${file}: ${unknown.join(", ")}`);

  // every layer is transparent: an opaque background would slide with a moving layer
  const html = layers
    .map(
      (l, i) =>
        `<div class="ill-layer" data-layer="${l.name}"${l.live ? " data-live" : ""}>` +
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="ill ${scope}" aria-hidden="true" style="background:transparent">` +
        `${i ? "" : style + rootDefs}${l.ids.map((id) => groups.get(id)).join("\n")}</svg></div>`,
    )
    .join("\n");

  writeFileSync(
    `${OUT}/${name}-svg.ts`,
    `// Generated by scripts/illustrations-svg.mjs from public/illustrations/${file} — do not edit by hand.\n` +
      `export const LABEL = ${JSON.stringify(label)};\n` +
      `export const LAYERS = ${JSON.stringify(html)};\n`,
  );
  console.log(`${name}: ${layers.length} layers, ${groups.size} groups, ${refd.size} ids scoped`);
}

mkdirSync(OUT, { recursive: true });
ILLUSTRATIONS.forEach(build);
// the receipt's curve + drawer geometry (written by the register generator)
writeFileSync(`${OUT}/register-data.json`, readFileSync("public/illustrations/register-iso.data.json", "utf8"));
