/**
 * A fixed glass navbar refracts scrolling editorial images through a curved lens with spectral color separation.
 */
"use client";

import { useEffect, useRef } from "react";

export type GlassProject = { src: string; title: string };
export type GlassScrollNavbarProps = {
  projects?: GlassProject[];
  className?: string;
  /** Fraction of the viewport occupied by the lens. */
  band?: number;
  strength?: number;
  chromatic?: number;
};

const PROJECTS: GlassProject[] = [2, 6, 4, 5, 1, 3, 6, 2, 5, 4, 3, 1].map((photo) => ({
  src: `/image-animations/photo-${photo}.jpg`,
  title: ["Blanket pug", "Waterfall", "Resting pug", "Leopard", "Walruses", "Lake canoe"][photo - 1],
}));

// Circular sag grows toward the screen edge; spectral sampling separates color.
const FRAGMENT = `
precision mediump float;
uniform sampler2D uScene;
uniform float uBand;
uniform float uStrength;
uniform float uChromatic;
varying vec2 vUv;
void main() {
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float t = clamp(1.0 - uv.y / uBand, 0.0, 1.0);
  float displacement = (1.0 - sqrt(max(0.0, 1.0-t*t))) * uBand * uStrength;
  uv.y += displacement;
  if (displacement < 0.00001) {
    gl_FragColor = texture2D(uScene, uv);
    return;
  }
  vec3 color = vec3(0.0);
  vec3 weights = vec3(0.0);
  for (int i=0; i<16; i++) {
    float p = float(i)/15.0;
    vec3 weight = vec3(1.0-smoothstep(0.2,0.8,p), smoothstep(0.0,0.5,p)*(1.0-smoothstep(0.5,1.0,p)), smoothstep(0.2,0.8,p));
    float shift = (p-0.5)*uChromatic*displacement*30.0;
    color += texture2D(uScene, clamp(uv+vec2(0.0,shift),0.0,1.0)).rgb*weight;
    weights += weight;
  }
  gl_FragColor = vec4(color/weights,1.0);
}`;

export default function GlassScrollNavbar({ projects = PROJECTS, className = "", band = 0.08, strength = 1, chromatic = 0.01 }: GlassScrollNavbarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const safeBand = Number.isFinite(band) ? Math.min(0.25, Math.max(0.03, band)) : 0.08;

  useEffect(() => {
    const root = rootRef.current;
    const scroller = scrollRef.current;
    const canvas = canvasRef.current;
    if (!root || !scroller || !canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    const scene = document.createElement("canvas");
    const ctx = scene.getContext("2d");
    if (!gl || !ctx) return;
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, "attribute vec2 aPosition; varying vec2 vUv; void main(){vUv=aPosition*0.5+0.5;gl_Position=vec4(aPosition,0.0,1.0);}");
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) { shaders.forEach(s => gl.deleteShader(s)); if (program) gl.deleteProgram(program); return; }
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, "uScene"), 0);
    gl.uniform1f(gl.getUniformLocation(program, "uBand"), safeBand);
    gl.uniform1f(gl.getUniformLocation(program, "uStrength"), Number.isFinite(strength) ? Math.max(0, strength) : 1);
    gl.uniform1f(gl.getUniformLocation(program, "uChromatic"), Number.isFinite(chromatic) ? Math.max(0, chromatic) : 0.01);
    let frame = 0;
    let disposed = false;
    let failed = false;
    const images = [...scroller.querySelectorAll<HTMLImageElement>("img")];
    const draw = () => {
      frame = 0;
      if (disposed || failed) return;
      const rect = scroller.getBoundingClientRect();
      const width = scroller.clientWidth, height = scroller.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(width*dpr), ph = Math.round(height*dpr);
      if (!pw || !ph) return;
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = scene.width = pw; canvas.height = scene.height = ph;
        gl.viewport(0, 0, pw, ph);
      }
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle = getComputedStyle(root).backgroundColor; ctx.fillRect(0,0,width,height);
      for (const image of images) {
        const r = image.getBoundingClientRect();
        const x=r.left-rect.left, y=r.top-rect.top;
        if (y>height || y+r.height<0) continue;
        ctx.fillStyle = getComputedStyle(root).backgroundColor; ctx.fillRect(x,y,r.width,r.height);
        if (image.complete && image.naturalWidth) {
          const ratio = Math.max(r.width/image.naturalWidth,r.height/image.naturalHeight);
          const sw=r.width/ratio, sh=r.height/ratio;
          ctx.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)/2,sw,sh,x,y,r.width,r.height);
        }
      }
      try {
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,scene);
        gl.drawArrays(gl.TRIANGLES,0,6);
        canvas.style.opacity="1";
      } catch {
        // Cross-origin images without CORS retain the accessible DOM + blur fallback.
        failed=true; canvas.style.opacity="0";
      }
    };
    const schedule = () => { if (!frame && !disposed) frame=requestAnimationFrame(draw); };
    const onLost = (event: Event) => { event.preventDefault(); failed=true; canvas.style.opacity="0"; };
    canvas.addEventListener("webglcontextlost", onLost);
    scroller.addEventListener("scroll", schedule, {passive:true});
    images.forEach(image => {image.addEventListener("load",schedule);image.addEventListener("error",schedule);});
    const resize = new ResizeObserver(schedule); resize.observe(root); resize.observe(scroller);
    const theme = new MutationObserver(schedule);
    theme.observe(document.documentElement, {attributes:true,attributeFilter:["class","style"]});
    schedule();
    return () => {
      disposed=true; cancelAnimationFrame(frame); resize.disconnect(); theme.disconnect();
      scroller.removeEventListener("scroll",schedule);
      canvas.removeEventListener("webglcontextlost",onLost);
      images.forEach(image => {image.removeEventListener("load",schedule);image.removeEventListener("error",schedule);});
      shaders.forEach(shader => gl.deleteShader(shader));
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      canvas.style.opacity="0";
    };
  }, [projects, safeBand, strength, chromatic]);

  return (
    <div ref={rootRef} className={`relative isolate h-[min(760px,calc(100dvh-180px))] min-h-[380px] w-full overflow-hidden bg-background text-foreground ${className}`}>
      <div ref={scrollRef} data-lenis-prevent tabIndex={0} role="region" aria-label="Scroll the glass navbar gallery" className="h-full overflow-y-auto overscroll-contain [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-foreground">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-2 p-2">
          {projects.map((project,index) => <article key={`${project.src}-${index}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.src} crossOrigin="anonymous" alt={project.title} draggable={false} className="aspect-[0.76] w-full object-cover" />
          </article>)}
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bg-white/10 backdrop-blur-sm" style={{height:`${safeBand*100}%`}} />
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-0" />
    </div>
  );
}
