"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const Shader1 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const [controls, setControls] = useState({
    resolutionXY: 100,
    distortion: true,
    mode: -3,
    mousemove: 0,
    modeA: 1,
    modeN: 0,
    speed: 1,
    frequency: 50,
    angle: 0.5,
    waveFactor: 1.4,
    pixelStrength: 3,
    quality: 5,
    contrast: 1,
    brightness: 1,
    colorExposer: 0.182,
    strength: 0.2,
    exposer: 8,
    onMouse: 0,
  });

  const [color, setColor] = useState("#5599FF");

  const vertexShader = `
    varying vec2 vuv;
    void main() {
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
      vuv = uv;
    }
  `;

  const fragmentShader = `
    uniform vec2 mouse;
    uniform float resolutionXY,uIntercept,scrollType,displaceAmount,time,frequency,angle,speed,waveFactor,contrast,pixelStrength,quality,brightness,colorExposer,strength,exposer,uScroll,uSection;
    uniform int onMouse,mousemove,mode,modeA,modeN;
    uniform vec2 mousei;
    uniform float maskVal,aspect,noise_speed,metaball,discard_threshold,antialias_threshold,noise_height,noise_scale;
    uniform bool distortion,gooey,masker,noEffectGooey;
    uniform vec3 color;
    varying vec2 vuv;
    uniform sampler2D uTexture;

    float mina(vec4 a){
      return min(min(a.r,a.g),a.b);
    }
    float maxa(vec4 a){
      return max(max(a.r,a.g),a.b);
    }
    vec4 minn(vec4 a,vec4 b){
      return vec4(min(a.r,b.r),min(a.g,b.g),min(a.b,b.b),1.);
    }
    vec4 maxx(vec4 a,vec4 b){
      return vec4(max(a.r,b.r),max(a.g,b.g),max(a.b,b.b),1.);
    }
    mat2 rotate2D(float r){
      return mat2(cos(r),sin(r),-sin(r),cos(r));
    }

    vec3 permute(vec3 x) { return mod(x * 34.0 + 1.0, 289.0); }
    vec4 permute(vec4 x) { return mod(x * 34.0 + 1.0, 289.0); }
    vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
    vec4 fade(vec4 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - vec3(0.5);
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 1.0 / 7.0;
      vec4 j = p - 49.0 * floor(p * n_) * n_;
      vec4 x_ = floor(j) * n_;
      vec4 y_ = fract(j) * n_;
      vec4 h = 1.0 - abs(x_ - 0.5) - abs(y_ - 0.5);
      vec4 b0 = vec4(x_.xy, y_.x, y_.y);
      vec4 b1 = vec4(x_.zw, y_.z, y_.w);
      vec4 s0 = floor(fract(b0) * 2.0) * 2.0 + 1.0;
      vec4 s1 = floor(fract(b1) * 2.0) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, x_.x);
      vec3 p1 = vec3(a0.zw, x_.y);
      vec3 p2 = vec3(a1.xy, x_.z);
      vec3 p3 = vec3(a1.zw, x_.w);
      vec4 norm = inversesqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 fade_xyzw = fade(vec4(x0, x1.x));
      float n0 = dot(p0, x0);
      float n1 = dot(p1, x1);
      float n2 = dot(p2, x2);
      float n3 = dot(p3, x3);
      vec2 fade_xy = fade_xyzw.xy;
      vec2 n_0_1 = mix(vec2(n0, n1), vec2(n2, n3), fade_xy.y);
      float n_0_1_2_3 = mix(n_0_1.x, n_0_1.y, fade_xy.x);
      return 2.3 * n_0_1_2_3;
    }

    vec4 img(vec2 uv){
      return texture2D(uTexture, uv);
    }

    void main(){
      vec2 resolution = vec2(resolutionXY * 20.0);
      float br = clamp(brightness, -1.0, 25.0);
      float freq = clamp(frequency, -999.0, 999.0);
      float cont = clamp(contrast, -50.0, 50.0);
      float pxl = clamp(pixelStrength, -20.0, 999.0);
      float strg = clamp(strength, -100.0, 100.0);
      float colExp = clamp(colorExposer, -5.0, 5.0);
      
      vec2 uv = 0.5 * (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
      uv = mousemove != 0 ? mix(uv, 0.5 * (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y + mouse / 300.0, uIntercept) : uv;
      
      float c = (sin((uv.x * 7.0 * snoise(vec3(uv, 1.0))) + time) / 15.0 * snoise(vec3(uv, 1.0))) + 0.01;
      vec3 col = vec3(0.0);
      vec2 n = vec2(0.0), q = vec2(0.0);
      vec2 p = uv + br / 10.0;
      float d = dot(p, p);
      float a = -(cont / 100.0);
      mat2 rot = rotate2D(angle);
      
      for(float i = 1.0; i <= 10.0; i++){
        if(i > quality) break;
        p *= rot;
        n *= rot;
        if(mousemove == 0)
          q = p * freq + time * speed + sin(time) * 0.0018 * i - pxl * n;
        else if(mousemove == 1)
          q = p * freq + time * speed + sin(time) * 0.0018 * i + mouse - pxl * n;
        else if(mousemove == 2)
          q = p * freq + time * speed + sin(time) * 0.0018 * i - pxl + mouse * n;
        else if(mousemove == 3)
          q = p * freq + time * speed + sin(time) * 0.0018 * i + mouse - pxl + mouse * n;
        
        if(modeA == 0)
          a += dot(sin(q) / freq, vec2(strg));
        else if(modeA == 1)
          a += dot(cos(q) / freq, vec2(strg));
        else if(modeA == 2)
          a += dot(tan(q) / freq, vec2(strg));
        
        if(modeN == 0)
          n -= sin(q);
        else if(modeN == 1)
          n -= cos(q);
        else if(modeN == 2)
          n -= tan(q);
        
        n = mousemove != 0 ? mix(n + mouse, n, uIntercept) : n;
        freq *= waveFactor;
      }
      
      col = (color * 4.5) * (a + colExp) + exposer * a + a + d;
      vec4 base = distortion ? img(vuv + a + cont / 100.0) : img(vuv);
      base = onMouse == 0 ? base : onMouse == 1 ? mix(img(vuv), base, uIntercept) : mix(base, img(vuv), uIntercept);
      
      vec4 blend = vec4(col, 1.0);
      vec4 final = mix(base, gl_FragColor, uIntercept);
      
      if(mode == -10)
        final = base;
      else if(mode == -1)
        final = minn(base, blend) - maxx(base, blend) + vec4(1.0);
      else if(mode == -9)
        final = (maxa(blend) == 1.0) ? blend : minn(base * base / (1.0 - blend), vec4(1.0));
      else if(mode == -8)
        final = base + blend - 2.0 * base * blend;
      else if(mode == -7)
        final = abs(base - blend);
      else if(mode == -6)
        final = minn(base, blend);
      else if(mode == -5)
        final = (mina(blend) == 0.0) ? blend : maxx((1.0 - ((1.0 - base) / blend)), vec4(0.0));
      else if(mode == -4)
        final = maxa(base) == 1.0 ? blend : minn(base / (1.0 - blend), vec4(1.0));
      else if(mode == -3)
        final = (1.0 - 2.0 * blend) * base * base + 2.0 * base * blend;
      else if(mode == -2)
        final = maxa(base) < 0.5 ? 2.0 * base * blend : 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
      else if(mode == 0)
        final = base + blend;
      else if(mode == 1)
        final = base * blend;
      else if(mode == 2)
        final = 1.0 - (1.0 - base) * (1.0 - blend);
      else if(mode == 3)
        final = blend - base;
      else if(mode == 4)
        final = base / (blend + 0.001);
      else if(mode == 5)
        final = maxx(base + blend - 1.0, vec4(0.0));
      else if(mode == 10)
        final = blend - base * blend;
      else if(mode == 11)
        final = (base + blend / 2.0);
      
      final = mix(final * br, mix(maxx(final, vec4(1.0)), final, cont), 0.5);
      final = onMouse == 0 ? final : onMouse == 1 ? mix(base, final, uIntercept) : mix(final, base, uIntercept);
      
      gl_FragColor = final;
    }
  `;

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 1200;
    const height = containerRef.current.clientHeight || 800;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(0x000000);
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";

    let texture: THREE.Texture;

    // Create a fallback white texture
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 50, 50);
      }
    }
    const fallbackTexture = new THREE.CanvasTexture(canvas);
    texture = fallbackTexture;
    fallbackTexture.minFilter = THREE.LinearFilter;
    fallbackTexture.magFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(2, 2, 32, 32);
    const colorObj = new THREE.Color(color);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        mouse: { value: new THREE.Vector2(0, 0) },
        resolutionXY: { value: controls.resolutionXY },
        uIntercept: { value: 0.5 },
        scrollType: { value: 0.0 },
        displaceAmount: { value: 0.0 },
        time: { value: 0.0 },
        frequency: { value: controls.frequency },
        angle: { value: controls.angle },
        speed: { value: controls.speed },
        waveFactor: { value: controls.waveFactor },
        contrast: { value: controls.contrast },
        pixelStrength: { value: controls.pixelStrength },
        quality: { value: controls.quality },
        brightness: { value: controls.brightness },
        colorExposer: { value: controls.colorExposer },
        strength: { value: controls.strength },
        exposer: { value: controls.exposer },
        uScroll: { value: 0.0 },
        uSection: { value: 0.0 },
        onMouse: { value: controls.onMouse },
        mousemove: { value: controls.mousemove },
        mode: { value: controls.mode },
        modeA: { value: controls.modeA },
        modeN: { value: controls.modeN },
        mousei: { value: new THREE.Vector2(0.5, 0.5) },
        maskVal: { value: 1.0 },
        aspect: { value: width / height },
        noise_speed: { value: 1.0 },
        metaball: { value: 0.0 },
        discard_threshold: { value: 0.0 },
        antialias_threshold: { value: 0.1 },
        noise_height: { value: 1.0 },
        noise_scale: { value: 1.0 },
        distortion: { value: controls.distortion },
        gooey: { value: false },
        masker: { value: false },
        noEffectGooey: { value: false },
        color: { value: colorObj },
      },
    });

    materialRef.current = material;
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Try to load image after material is created
    textureLoader.load(
      "https://cdn.cosmos.so/ad0d7459-9e2e-4a31-9f70-db9b76d13792?format=jpeg",
      (loadedTexture) => {
        loadedTexture.minFilter = THREE.LinearFilter;
        loadedTexture.magFilter = THREE.LinearFilter;
        material.uniforms.uTexture.value = loadedTexture;
        console.log("Image loaded successfully");
      },
      undefined,
      (error) => {
        console.error("Image failed to load:", error);
      }
    );

    const clock = new THREE.Clock();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseRef.current.x = (event.clientX - rect.left) / rect.width;
      mouseRef.current.y = (event.clientY - rect.top) / rect.height;
      material.uniforms.mousei.value.set(
        mouseRef.current.x,
        mouseRef.current.y
      );
      material.uniforms.mouse.value.set(event.movementX, event.movementY);
    };

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      material.uniforms.time.value = elapsed;
      material.uniforms.resolutionXY.value = controls.resolutionXY;
      material.uniforms.frequency.value = controls.frequency;
      material.uniforms.angle.value = controls.angle;
      material.uniforms.speed.value = controls.speed;
      material.uniforms.waveFactor.value = controls.waveFactor;
      material.uniforms.contrast.value = controls.contrast;
      material.uniforms.pixelStrength.value = controls.pixelStrength;
      material.uniforms.quality.value = controls.quality;
      material.uniforms.brightness.value = controls.brightness;
      material.uniforms.colorExposer.value = controls.colorExposer;
      material.uniforms.strength.value = controls.strength;
      material.uniforms.exposer.value = controls.exposer;
      material.uniforms.onMouse.value = controls.onMouse;
      material.uniforms.mousemove.value = controls.mousemove;
      material.uniforms.mode.value = controls.mode;
      material.uniforms.modeA.value = controls.modeA;
      material.uniforms.modeN.value = controls.modeN;
      material.uniforms.distortion.value = controls.distortion;

      renderer.render(scene, camera);
    };

    animate();
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [controls]);

  const updateColor = (hex: string) => {
    setColor(hex);
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.setStyle(hex);
    }
  };

  return (
    <div>
      <div ref={containerRef} className="flex-1" />
    </div>
  );
};

export default Shader1;
