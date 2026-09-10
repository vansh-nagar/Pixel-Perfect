# Local component recorder

Run `bun install`, `bunx playwright install chromium`, and install FFmpeg (`brew install ffmpeg` on macOS). Start `bun dev`, then open `/playground` on localhost.

Choose 1080 × 1080 or 1920 × 1080 and click **Record component**. The preview and **Download MP4** link appear when rendering finishes. Cancel stops an in-progress render. Nothing is uploaded.

The eight-second sequence shows the default card for 1.5 seconds, reveals it for 4.5 seconds, then resets for two seconds. A separate headless Chromium renders the component at the selected resolution. Its CSS animations and transitions are paused and sampled at 30 fps, then FFmpeg encodes H.264 MP4 with CRF 18, yuv420p and fast-start metadata. It records no audio. Recorder controls, navigation, development overlays and cursor are excluded.

The UI and capture page are development-only. The API additionally requires a loopback hostname and matching Origin header; it returns 404 in production. Only one export runs at a time, with a three-minute limit and temporary-file cleanup. The script requires Node 20 or newer.

To record a different component, replace the component in `capture-stage.tsx` and connect its interaction to `recorder-state`. This recorder samples CSS animation timelines; components driven by JavaScript timers, WebGL or video require their own deterministic time control.
