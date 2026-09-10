// Offline rendering: CSS timelines are sampled at 30 fps, independent of CPU speed.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { once } from "node:events";

const [origin, format, output] = process.argv.slice(2);
if (!origin || !output || !["square", "landscape"].includes(format) || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname)) throw new Error("Invalid local recording arguments");
const viewport = { width: format === "landscape" ? 1920 : 1080, height: 1080 };
const browser = await chromium.launch({ headless: true });
let encoder;
process.once("SIGTERM", async () => { encoder?.kill(); await browser.close(); process.exit(1); });
try {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "no-preference" });
  await page.goto(`${origin}/local-recorder`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-capture-ready="true"]', { state: "attached" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map(image => image.decode().catch(() => {})));
  });
  // Allow only the stage to paint: dev tools and any body portals stay outside capture.
  await page.addStyleTag({ content: `body * { visibility: hidden !important; } [data-capture-stage], [data-capture-stage] * { visibility: visible !important; }` });
  encoder = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", "30", "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", output], { stdio: ["pipe", "ignore", "pipe"] });
  let encoderError = "";
  encoder.stderr.on("data", chunk => { encoderError += chunk; });
  const finished = new Promise((resolve, reject) => {
    encoder.on("error", reject);
    encoder.on("close", code => code === 0 ? resolve() : reject(new Error(encoderError || `FFmpeg exited ${code}`)));
  });
  // Observe rejection immediately, including a missing FFmpeg binary.
  finished.catch(() => {});
  encoder.stdin.on("error", () => {});
  for (let frame = 0; frame < 240; frame++) {
    const time = frame * 1000 / 30;
    if (frame === 45 || frame === 180) {
      await page.evaluate(expanded => window.dispatchEvent(new CustomEvent("recorder-state", { detail: expanded })), frame === 45);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    }
    await page.evaluate(time => {
      window.recordingAnimations ??= new Map();
      for (const animation of document.getAnimations()) {
        if (!window.recordingAnimations.has(animation)) {
          window.recordingAnimations.set(animation, time);
          animation.pause();
        }
        animation.currentTime = time - window.recordingAnimations.get(animation);
      }
    }, time);
    const image = await page.screenshot({ type: "png" });
    if (encoder.exitCode !== null) throw new Error(encoderError || "Encoder stopped");
    if (!encoder.stdin.write(image)) await once(encoder.stdin, "drain");
  }
  encoder.stdin.end();
  await finished;
} finally {
  encoder?.kill();
  await browser.close();
}
