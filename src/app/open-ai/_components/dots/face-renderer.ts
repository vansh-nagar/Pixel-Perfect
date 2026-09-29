/**
 * Draws dots characters onto plain 2D canvases, so they can live inside CSS 3D scenes.
 *
 * One WebGL renderer is shared by every face. Each face has its own scene (the dots
 * hero's lights, one furry character) and, per frame, renders into the shared canvas
 * and is copied onto its own 2D canvas with drawImage. The 2D canvas is ordinary DOM,
 * so CSS transforms (perspective, rotateY, bob) apply to the character too.
 *
 * Rendering matches the dots hero: 4x MSAA half-float target, then a resolve pass with
 * ACES tone mapping (exposure 0.8) and the site's saturation grade.
 */
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  buildCharacter,
  CHARACTER_NAMES,
  COLOR_GRADE,
  sampleToddReveal,
  TODD_REVEAL_SECONDS,
  type CharacterName,
} from "./characters";
import { applyFur } from "./fur";

const MODEL_URLS: Record<CharacterName, string> = {
  Alfred: "/open-ai/dots/alfred.glb",
  Felipe: "/open-ai/dots/felipe.glb",
  Iggy: "/open-ai/dots/iggy.glb",
  Todd: "/open-ai/dots/todd.glb",
};

/** Character height and vertical offset in the face's [-1, 1] frame. Leaves headroom for the hop. */
const FRAMING = { height: 0.96, y: -0.12 };

export type CharacterModels = Record<CharacterName, THREE.Object3D>;
export type Look = { x: number; y: number };

/** Anything a face can draw: the GLB cast (via dotsCharacter) or the custom plush cast. */
export type Character = {
  scene: THREE.Object3D;
  center: THREE.Vector3;
  size: THREE.Vector3;
  /** Plays the hop (Todd: a look-around). The ambient idle loops after it. */
  excite(): void;
  /** Advances motion by `delta` seconds and poses the character, eyes toward `look`. */
  update(delta: number, look: Look): void;
  dispose(): void;
};

export async function loadCharacterModels(): Promise<CharacterModels> {
  const loader = new GLTFLoader();
  const gltfs = await Promise.all(CHARACTER_NAMES.map((name) => loader.loadAsync(MODEL_URLS[name])));
  const [Alfred, Felipe, Iggy, Todd] = gltfs.map((gltf) => gltf.scene);
  return { Alfred, Felipe, Iggy, Todd };
}

// The dots hero light rig, at viewport scale 1.
function addLights(scene: THREE.Scene) {
  const aim = (light: THREE.Object3D) => light.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.8));
  scene.add(new THREE.HemisphereLight("#ffffff", "#d8e3f0", 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.85);
  key.position.set(-5, 7, 6);
  scene.add(key);
  for (const [x, y, z, width, height, intensity] of [
    [-6, 7, 1, 5, 6, 0.2],
    [5, 1, -2, 4, 7, 1.3],
    [0, -5, -1, 5, 3, 1],
  ]) {
    const light = new THREE.RectAreaLight(0xffffff, intensity, width, height);
    light.position.set(x, y, z);
    aim(light);
    scene.add(light);
  }
}

function createResolver(gl: THREE.WebGLRenderer, samples: number) {
  const count = Math.min(samples, gl.capabilities.maxSamples);
  if (count < 2 || !gl.extensions.has("EXT_color_buffer_float")) return null;
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: count,
    depthBuffer: true,
    stencilBuffer: false,
    resolveDepthBuffer: false,
    resolveStencilBuffer: false,
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      artwork: { value: target.texture },
      premultiplyOutput: { value: gl.getContext().getContextAttributes()?.premultipliedAlpha ?? true },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = position.xy * 0.5 + 0.5;
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D artwork;
      uniform bool premultiplyOutput;
      varying vec2 vUv;
      void main() {
        vec4 sampleColor = texture2D(artwork, vUv);
        float coverage = clamp(sampleColor.a, 0.0, 1.0);
        // MSAA averages solid geometry with transparent black. Unassociate
        // coverage before the nonlinear transforms to avoid edge halos.
        vec3 straightColor = coverage > 0.00001 ? sampleColor.rgb / coverage : vec3(0.0);
        gl_FragColor = vec4(straightColor, coverage);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        ${COLOR_GRADE}
        if (premultiplyOutput) gl_FragColor.rgb *= coverage;
      }
    `,
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: true,
  });
  const quad = new THREE.Mesh(geometry, material);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCamera = new THREE.Camera();
  const size = new THREE.Vector2();
  return {
    render(scene: THREE.Scene, camera: THREE.Camera) {
      gl.getDrawingBufferSize(size);
      if (target.width !== size.x || target.height !== size.y) target.setSize(size.x, size.y);
      gl.setRenderTarget(target);
      gl.render(scene, camera);
      gl.setRenderTarget(null);
      gl.render(quadScene, quadCamera);
    },
    dispose() {
      target.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

/** Wraps one of the four openai.com characters as a `Character`. */
export function dotsCharacter(source: THREE.Object3D, name: CharacterName): Character {
  const character = buildCharacter(source, name);
  let revealClock: number | null = null;
  return {
    scene: character.scene,
    center: character.center,
    size: character.size,
    excite() {
      if (character.kind === "motion") character.motion.excite();
      revealClock = 0;
    },
    update(delta, look) {
      if (character.kind === "motion") {
        character.motion.update(delta);
        character.poseHero(look);
        return;
      }
      if (revealClock !== null) revealClock += delta;
      const clock = revealClock;
      const revealing = clock !== null && clock < TODD_REVEAL_SECONDS;
      character.pose(revealing ? sampleToddReveal(clock) : undefined, look.x, look.y);
    },
    dispose: () => character.dispose(),
  };
}

export type Face = {
  /** Plays the character's hop (Todd: a look-around). Ambient idle loops after it. */
  excite(): void;
  /** Advances motion by `delta` seconds and draws the character onto `ctx`. */
  draw(ctx: CanvasRenderingContext2D, delta: number, look: Look): void;
  dispose(): void;
};

let lightsReady = false;

export function createFaceRenderer(size: number) {
  if (!lightsReady) {
    RectAreaLightUniformsLib.init();
    lightsReady = true;
  }
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(size, size, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.setClearColor(0x000000, 0);
  const resolver = createResolver(renderer, 4);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 0, 25);

  const render = (scene: THREE.Scene) => {
    if (resolver) resolver.render(scene, camera);
    else {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    }
  };

  return {
    createFace(character: Character): Face {
      const scene = new THREE.Scene();
      addLights(scene);
      const group = new THREE.Group();
      character.scene.position.copy(character.center).negate();
      group.add(character.scene);
      scene.add(group);
      const removeFur = applyFur(character.scene);

      return {
        excite: () => character.excite(),
        draw(ctx, delta, look) {
          group.position.set(0, FRAMING.y, 0);
          group.rotation.set(0.035 - 0.1 * look.y, 0.16 * look.x, 0);
          group.scale.setScalar(FRAMING.height / character.size.y);
          character.update(delta, { x: 0.6 * look.x, y: 0.6 * look.y });
          render(scene);
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.drawImage(renderer.domElement, 0, 0, ctx.canvas.width, ctx.canvas.height);
        },
        dispose() {
          removeFur();
          character.dispose();
        },
      };
    },
    dispose() {
      resolver?.dispose();
      renderer.dispose();
    },
  };
}
