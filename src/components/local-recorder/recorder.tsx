"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import styles from "./recorder.module.css";

/** Drop into a React app's root layout. No Next.js APIs or server required. */
export function LocalRecorder({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [popup, setPopup] = useState<Window | null>(null);
  const [status, setStatus] = useState<"idle" | "choosing" | "recording" | "paused">("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ url: string; extension: string; size: number }>();
  const [resolution, setResolution] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const popupRef = useRef<Window | null>(null);
  const alive = useRef(true);
  const active = status === "recording" || status === "paused";

  function stop() { if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop(); }
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (recorder.current?.state !== "inactive") recorder.current?.stop();
      stream.current?.getTracks().forEach(track => track.stop());
      popupRef.current?.close();
    };
  }, []);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => {
    if (status !== "recording") return;
    const timer = setInterval(() => setElapsed(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);
  useEffect(() => {
    if (!popup) return;
    const timer = setInterval(() => {
      if (!popup.closed) return;
      stop(); setPopup(null); popupRef.current = null; setOpen(true);
    }, 400);
    return () => clearInterval(timer);
  }, [popup]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.code === "KeyR") { event.preventDefault(); stop(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  function openControls() {
    setError("");
    if (popup && !popup.closed) { popup.focus(); return; }
    const next = window.open("", "local-video-recorder", "popup,width=390,height=640");
    if (!next) { setError("Allow popups for this local site to open the recording controls."); return; }
    next.document.title = "Local recorder";
    next.document.body.style.cssText = "margin:0;background:#fafafa;color:#18181b;font:14px system-ui,sans-serif;";
    // Copy only styles, not the app or its controls, into this independent window.
    next.document.head.querySelectorAll("style,link[rel=stylesheet]").forEach(node => node.remove());
    document.querySelectorAll("style,link[rel=stylesheet]").forEach(node => next.document.head.appendChild(node.cloneNode(true)));
    popupRef.current = next;
    setPopup(next);
    setOpen(false);
  }

  async function start() {
    if (status !== "idle") return;
    setError("");
    // Capture must originate in the focused window that received the click.
    const captureWindow = popupRef.current;
    if (!captureWindow || captureWindow.closed) { setError("Reopen the recording controls and try again."); return; }
    if (!captureWindow.navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      setError("Open this local site in Chrome or Edge to record a browser tab."); return;
    }
    setStatus("choosing");
    try {
      const capture = await captureWindow.navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser", width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
        audio: false,
      });
      stream.current = capture;
      if (!alive.current || popupRef.current?.closed) { capture.getTracks().forEach(track => track.stop()); if (alive.current) setStatus("idle"); return; }
      const settings = capture.getVideoTracks()[0].getSettings();
      if (settings.displaySurface && settings.displaySurface !== "browser") {
        throw new Error("Choose a browser tab, not a window or entire screen, to keep the controls out of your recording.");
      }
      const mimeType = ["video/mp4;codecs=avc1.42001E", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error("This browser has no supported video encoder. Try Chrome or Edge.");
      const recording = new MediaRecorder(capture, { mimeType, videoBitsPerSecond: 12_000_000 });
      const chunks: Blob[] = [];
      recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recording.onstop = () => {
        capture.getTracks().forEach(track => track.stop()); stream.current = null;
        if (!alive.current) return;
        const blob = new Blob(chunks, { type: recording.mimeType });
        if (blob.size) setResult({ url: URL.createObjectURL(blob), extension: recording.mimeType.includes("mp4") ? "mp4" : "webm", size: blob.size });
        setStatus("idle");
      };
      recording.onerror = () => { setError("The browser stopped recording. Any available footage is kept below."); stop(); };
      capture.getVideoTracks()[0].onended = stop;
      recorder.current = recording;
      setResult(undefined); setElapsed(0);
      setResolution(`${settings.width} × ${settings.height} · ${Math.round(settings.frameRate || 30)} fps`);
      // Hide controls synchronously; background-window animation frames can stall.
      flushSync(() => setStatus("recording"));
      if (!capture.active || popupRef.current?.closed) { capture.getTracks().forEach(track => track.stop()); setStatus("idle"); return; }
      recording.start(1000);
    } catch (cause) {
      stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
      if (!alive.current) return;
      setStatus("idle");
      // Popup exceptions belong to another realm, so instanceof DOMException is unreliable.
      const failure = cause as { name?: string; message?: string } | null;
      setError(failure?.name === "NotAllowedError"
        ? "Capture cancelled or blocked. Click Start to choose the app tab again."
        : failure?.name === "InvalidStateError"
          ? "The browser could not start capture from this window. Click Start again with these controls focused. If you’re in the embedded preview, open the site in Chrome or Edge."
          : failure?.message || "Could not start recording. Try opening the local site in Chrome or Edge.");
    }
  }

  if (!enabled) return null;
  const controls = <section className={styles.panel} aria-label="Recording controls">
    <header><strong>local recorder</strong><span>on your device</span></header>
    <p>Choose the app’s browser tab, then interact with any page. These controls stay in this separate window.</p>
    <div className={styles.timer} role="timer">{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</div>
    <p role="status">{status === "recording" ? "Recording" : status === "paused" ? "Paused" : status === "choosing" ? "Choose the app tab…" : "Ready"}{resolution && ` · ${resolution}`}</p>
    {!active ? <button disabled={status === "choosing"} onClick={popup ? start : openControls}>{popup ? "Start recording" : "Open recording controls"}</button> : <div className={styles.actions}>
      <button onClick={() => { if (recorder.current?.state === "recording") { recorder.current.pause(); setStatus("paused"); } else if (recorder.current?.state === "paused") { recorder.current.resume(); setStatus("recording"); } }}>{status === "paused" ? "Resume" : "Pause"}</button>
      <button onClick={stop}>Stop recording</button>
    </div>}
    <small>Stop anytime with ⌥/Alt + Shift + R or the browser’s stop-sharing button. No automatic time limit. No audio.</small>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {result && <div className={styles.result}><video src={result.url} controls /><a href={result.url} download={`recording-${new Date().toISOString().slice(0,10)}.${result.extension}`}>Download {result.extension.toUpperCase()} · {(result.size / 1024 / 1024).toFixed(1)} MB</a><button className={styles.secondary} onClick={() => setResult(undefined)}>Discard recording</button></div>}
    <small>Captures at the tab’s available resolution, up to 1080p. MP4 when supported, otherwise WebM. Download before refreshing.</small>
  </section>;
  return <>
    {!active && status !== "choosing" && <div className={styles.dock} data-local-recorder>
      {open && !popup && controls}
      <button className={styles.launcher} aria-label="Open local recorder" aria-expanded={open || !!popup} onClick={() => popup ? popup.focus() : setOpen(value => !value)}><span /> record</button>
    </div>}
    {popup && createPortal(controls, popup.document.body)}
  </>;
}
