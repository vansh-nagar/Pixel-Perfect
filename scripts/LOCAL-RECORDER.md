# App-wide local recorder

The floating **record** button is mounted once in `src/app/layout.tsx`, only in development. It is available on every page, including `/blocks` and `/playground`.

1. Click **record → Open recording controls**. Allow the small controls popup.
2. In that window, click **Start recording** and select the app's **browser tab** in the browser sharing picker.
3. Interact, scroll, and navigate through the app. Pause/resume whenever needed.
4. Click **Stop recording**, press **Alt/Option + Shift + R** in the app, or use the browser's stop-sharing button.
5. Preview and download the video. MP4 is preferred when the browser supports it; WebM is the fallback. Discard releases the previous video.

The floating launcher disappears while recording; the controls live in a separate window. Window/whole-screen captures are rejected when the browser reports the source type, because they could include those controls. Choose the app tab even on browsers that do not report a source type. Closing the controls window stops recording and makes the preview available in the app's panel.

Capture requests 1920×1080 at 60 fps and 12 Mbps. Actual resolution/frame rate are determined by the tab and browser and shown in the panel; it does not upscale a smaller tab and call it HD. No audio, no server, no upload, and no automatic duration limit. Video is held in memory, so download before refreshing or navigating away with a full page load. Client-side route changes preserve the recording. Long recordings consume memory.

Use a desktop browser with tab capture support, such as Chrome or Edge. The embedded preview browser may not expose screen capture. Browser permission is required each time.

## Reuse in another project

Copy `src/components/local-recorder/recorder.tsx` and `recorder.module.css` together. They depend only on React and React DOM, with no Next.js APIs, icon package, API route, Playwright, or FFmpeg dependency.

```tsx
import { LocalRecorder } from "./recorder";

// Mount once at the app root so navigation preserves recording.
{process.env.NODE_ENV === "development" && <LocalRecorder />}
```

For Vite use `import.meta.env.DEV` as the development guard. The optional `enabled` prop also controls visibility. This is a reusable component, not a published npm package.

## Existing scripted card renderer

The earlier eight-second deterministic card export remains available through the development-only `/api/local-recorder` endpoint and `scripts/record-component.mjs`. It requires Playwright Chromium and FFmpeg. It is independent of the global manual recorder and is not needed when copying the reusable component.
