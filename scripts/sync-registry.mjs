#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "registry.json");
const COMPONENTS_DIR = path.join(ROOT, "registry/new-york");
const TARGET_DIR = "components/pixel-perfect";

const BUILTIN_DEPS = new Set(["react", "react-dom", "next"]);

// Map a local `@/components/ui/<name>` import to the external registry id it
// must resolve to in a consumer project (when the component was itself added
// from a third-party registry rather than the default one).
const REGISTRY_ALIASES = {
  "dotm-square-11": "@dotmatrix/dotm-square-11",
};

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function humanize(slug) {
  return slug
    .split("-")
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function extractDescription(content) {
  const m = content.match(/\/\*\*([\s\S]*?)\*\//);
  if (!m) return null;
  const lines = m[1]
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter((l) => l && !l.startsWith("@"));
  return lines.length > 0 ? lines[0] : null;
}

function extractImports(content) {
  const re =
    /import\s+(?:type\s+)?(?:[\w*\s{},$]+\s+from\s+)?["']([^"']+)["']/g;
  const imports = [];
  let m;
  while ((m = re.exec(content))) imports.push(m[1]);
  return imports;
}

function classifyDeps(imports) {
  const npm = new Set();
  const registry = new Set();
  for (const spec of imports) {
    if (spec.startsWith(".") || spec.startsWith("registry/")) continue;
    if (spec.startsWith("@/components/ui/")) {
      const ui = spec.replace("@/components/ui/", "").split("/")[0];
      registry.add(REGISTRY_ALIASES[ui] ?? ui);
      continue;
    }
    if (spec.startsWith("@/")) continue;

    const root = spec.startsWith("@")
      ? spec.split("/").slice(0, 2).join("/")
      : spec.split("/")[0];
    if (!BUILTIN_DEPS.has(root)) npm.add(root);
  }
  return { npm: [...npm].sort(), registry: [...registry].sort() };
}

function arrayEq(a = [], b = []) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function sync({ build = true, quiet = false } = {}) {
  const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
  const registry = JSON.parse(raw);
  const byName = new Map(registry.items.map((it) => [it.name, it]));

  const files = walk(COMPONENTS_DIR);
  let added = 0;
  let updated = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const name = path.basename(file, path.extname(file));
    const content = fs.readFileSync(file, "utf8");

    const inferredDesc = extractDescription(content);
    const description = inferredDesc ?? `${humanize(name)} component.`;
    const { npm, registry: regDeps } = classifyDeps(extractImports(content));

    const fileEntry = {
      type: "registry:component",
      path: rel,
      target: `${TARGET_DIR}/${path.basename(file)}`,
    };

    const existing = byName.get(name);
    if (existing) {
      const mergedNpm = [
        ...new Set([...(existing.dependencies ?? []), ...npm]),
      ].sort();
      const mergedReg =
        regDeps.length > 0
          ? [
              ...new Set([
                ...(existing.registryDependencies ?? []),
                ...regDeps,
              ]),
            ].sort()
          : existing.registryDependencies;

      let changed = false;
      if (!arrayEq(mergedNpm, existing.dependencies ?? [])) {
        existing.dependencies = mergedNpm;
        changed = true;
      }
      if (
        mergedReg &&
        !arrayEq(mergedReg, existing.registryDependencies ?? [])
      ) {
        existing.registryDependencies = mergedReg;
        changed = true;
      }
      if (changed) updated++;
      continue;
    }

    const entry = {
      name,
      description,
      type: "registry:block",
      dependencies: npm,
      ...(regDeps.length > 0 && { registryDependencies: regDeps }),
      files: [fileEntry],
    };
    byName.set(name, entry);
    added++;
    if (!quiet) console.log(`  + ${name}`);
  }

  fs.writeFileSync(
    REGISTRY_PATH,
    JSON.stringify({ ...registry, items: [...byName.values()] }, null, 2) +
      "\n",
  );

  if (!quiet) {
    if (added || updated)
      console.log(`✓ Synced: ${added} added, ${updated} updated.`);
    else console.log("✓ Already up to date.");
  }

  if (build) {
    if (!quiet) console.log("→ shadcn build");
    execSync("npx shadcn build", { stdio: "inherit", cwd: ROOT });
  }
}

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const noBuild = args.includes("--no-build");

if (watch) {
  sync({ build: !noBuild });
  console.log(
    `\n👀 Watching ${path.relative(ROOT, COMPONENTS_DIR).replace(/\\/g, "/")}/ for changes...`,
  );
  let timer;
  fs.watch(COMPONENTS_DIR, { recursive: true }, (_event, filename) => {
    if (!filename || !/\.tsx?$/.test(filename)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`\n[${new Date().toLocaleTimeString()}] change → syncing`);
      try {
        sync({ build: !noBuild, quiet: false });
      } catch (err) {
        console.error("✗ sync failed:", err.message);
      }
    }, 300);
  });
} else {
  sync({ build: !noBuild });
}
