"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Video, X } from "lucide-react";

export function LocalRecorder() {
  const [format, setFormat] = useState("square");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [video, setVideo] = useState<string>();
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => () => { if (video) URL.revokeObjectURL(video); }, [video]);

  async function record() {
    setError("");
    setVideo(undefined);
    setBusy(true);
    controller.current = new AbortController();
    try {
      const response = await fetch("/api/local-recorder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }), signal: controller.current.signal,
      });
      if (!response.ok) throw new Error((await response.json()).error || "Recording failed.");
      setVideo(URL.createObjectURL(await response.blob()));
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setError(cause instanceof Error ? cause.message : "Recording failed.");
      }
    } finally { setBusy(false); controller.current = null; }
  }

  return (
    <aside className="fixed right-5 bottom-5 z-50 w-80 rounded-2xl border border-black/10 bg-white p-4 text-sm text-zinc-900 shadow-xl" aria-label="Local video recorder">
      <div className="mb-3 flex items-center gap-2 font-medium"><Video size={16} /> local recorder <span className="ml-auto text-xs text-zinc-400">development only</span></div>
      <label className="flex items-center justify-between gap-3">Video size
        <select value={format} onChange={event => setFormat(event.target.value)} disabled={busy} className="rounded-lg border p-1.5">
          <option value="square">1080 × 1080</option>
          <option value="landscape">1920 × 1080</option>
        </select>
      </label>
      <p className="my-3 text-xs leading-relaxed text-zinc-500">8-second hover loop · 30 fps · MP4<br />Only the component stage is recorded.</p>
      <button onClick={record} disabled={busy} className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-white disabled:opacity-50">{busy ? "Rendering HD frames…" : "Record component"}</button>
      {busy && <button className="mt-2 flex items-center gap-1 text-xs" onClick={() => controller.current?.abort()}><X size={12} /> Cancel</button>}
      {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
      {video && <div className="mt-3"><video src={video} controls className="w-full rounded-lg" /><a href={video} download={`design-engineer-${format}.mp4`} className="mt-2 flex items-center justify-center gap-2 rounded-lg border p-2"><Download size={14} /> Download MP4</a></div>}
      <span className="sr-only" role="status">{busy ? "Rendering video locally" : video ? "Video ready to download" : ""}</span>
    </aside>
  );
}
