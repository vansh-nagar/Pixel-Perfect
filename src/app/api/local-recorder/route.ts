import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";
let busy = false;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const localHosts = ["localhost", "127.0.0.1", "[::1]"];
  if (process.env.NODE_ENV !== "development" || !localHosts.includes(url.hostname)) {
    return new Response(null, { status: 404 });
  }
  // A remote page must never be able to launch a browser on the developer's machine.
  if (request.headers.get("origin") !== url.origin) {
    return Response.json({ error: "Use the recorder from the local playground." }, { status: 403 });
  }
  let format: string;
  try { ({ format } = await request.json()); } catch {
    return Response.json({ error: "Invalid recording request." }, { status: 400 });
  }
  if (!["square", "landscape"].includes(format)) {
    return Response.json({ error: "Choose a supported video size." }, { status: 400 });
  }
  if (busy) return Response.json({ error: "A recording is already running." }, { status: 409 });
  busy = true;
  let directory: string | undefined;
  try {
    directory = await mkdtemp(path.join(tmpdir(), "pixel-recorder-"));
    const output = path.join(directory, "component.mp4");
    await new Promise<void>((resolve, reject) => {
      execFile(process.execPath, [path.join(process.cwd(), "scripts/record-component.mjs"), url.origin, format, output],
        { timeout: 180_000, signal: request.signal, maxBuffer: 1024 * 1024 },
        (error, _stdout, stderr) => error ? reject(new Error(stderr || error.message)) : resolve());
    });
    return new Response(await readFile(output), { headers: {
      "Content-Type": "video/mp4", "Content-Disposition": `attachment; filename="design-engineer-${format}.mp4"`, "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("Local recorder:", error);
    return Response.json({ error: "Could not render the video. Check that FFmpeg and Playwright Chromium are installed; see the local terminal for details." }, { status: 500 });
  } finally {
    busy = false;
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}
