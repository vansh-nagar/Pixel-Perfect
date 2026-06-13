import * as THREE from "three";

/**
 * A three.js texture that plays an animated image (GIF / animated WebP).
 *
 * Static loaders only ever upload a GIF's first frame, so we decode every frame
 * with the WebCodecs `ImageDecoder` and blit the current one onto a canvas each
 * tick. Falls back to a plain static load when `ImageDecoder` is unavailable.
 */
export type AnimatedTexture = {
  texture: THREE.Texture;
  /** Advance to the frame for the given elapsed time. Call once per render. */
  update: (elapsedMs: number) => void;
  dispose: () => void;
};

type Frame = { bitmap: ImageBitmap; durationMs: number };

// Minimal structural type for ImageDecoder so we don't depend on a specific
// TypeScript lib version shipping the WebCodecs DOM types.
type DecodedFrame = {
  image: {
    displayWidth: number;
    displayHeight: number;
    duration: number | null;
    close: () => void;
  };
};
type ImageDecoderLike = {
  completed: Promise<void>;
  tracks: { ready: Promise<void>; selectedTrack?: { frameCount: number } };
  decode: (opts: { frameIndex: number }) => Promise<DecodedFrame>;
  close: () => void;
};
type ImageDecoderCtor = new (init: {
  data: BufferSource;
  type: string;
}) => ImageDecoderLike;

export function createAnimatedTexture(url: string): AnimatedTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  let frames: Frame[] = [];
  let totalDuration = 0;
  let lastIndex = -1;
  let disposed = false;

  // Resizing the canvas after the first upload would make three.js try to
  // texSubImage into a smaller GPU allocation ("Offset overflows texture
  // dimensions"). Disposing frees the GL texture — but keeps the JS object and
  // its uniform binding — so the next render re-allocates at the new size.
  const resizeCanvas = (w: number, h: number) => {
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    texture.dispose();
  };

  const drawStatic = (source: CanvasImageSource, w: number, h: number) => {
    if (disposed || !ctx) return;
    resizeCanvas(w, h);
    ctx.drawImage(source, 0, 0, w, h);
    texture.needsUpdate = true;
  };

  // Fallback: load the first frame as a normal image.
  const loadStatic = () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => drawStatic(img, img.naturalWidth, img.naturalHeight);
    img.src = url;
  };

  const ImageDecoderImpl = (
    globalThis as unknown as { ImageDecoder?: ImageDecoderCtor }
  ).ImageDecoder;

  if (!ImageDecoderImpl || !ctx) {
    loadStatic();
  } else {
    (async () => {
      try {
        const buffer = await (await fetch(url)).arrayBuffer();
        if (disposed) return;
        const decoder = new ImageDecoderImpl({
          data: buffer,
          type: "image/gif",
        });
        await decoder.tracks.ready;
        await decoder.completed;
        if (disposed) {
          decoder.close();
          return;
        }

        const count = decoder.tracks.selectedTrack?.frameCount ?? 1;
        const decoded: Frame[] = [];
        for (let i = 0; i < count; i++) {
          const { image } = await decoder.decode({ frameIndex: i });
          const bitmap = await createImageBitmap(
            image as unknown as ImageBitmapSource,
          );
          // VideoFrame.duration is in microseconds; default to ~100ms.
          decoded.push({ bitmap, durationMs: (image.duration ?? 100_000) / 1000 });
          image.close();
        }
        decoder.close();
        if (disposed) {
          decoded.forEach((f) => f.bitmap.close());
          return;
        }

        frames = decoded;
        totalDuration = frames.reduce((sum, f) => sum + f.durationMs, 0) || 1;
        if (frames[0]) {
          drawStatic(frames[0].bitmap, frames[0].bitmap.width, frames[0].bitmap.height);
          lastIndex = 0;
        }
      } catch {
        if (!disposed) loadStatic();
      }
    })();
  }

  const update = (elapsedMs: number) => {
    if (disposed || frames.length <= 1 || !ctx) return;
    const t = elapsedMs % totalDuration;
    let acc = 0;
    let index = 0;
    for (let i = 0; i < frames.length; i++) {
      acc += frames[i].durationMs;
      if (t < acc) {
        index = i;
        break;
      }
    }
    if (index === lastIndex) return;
    lastIndex = index;
    ctx.drawImage(frames[index].bitmap, 0, 0);
    texture.needsUpdate = true;
  };

  const dispose = () => {
    disposed = true;
    frames.forEach((f) => f.bitmap.close());
    frames = [];
    texture.dispose();
  };

  return { texture, update, dispose };
}
