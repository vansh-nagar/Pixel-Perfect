import * as THREE from "three";
import * as F from "./fluid-shaders";

const SIM_RES = 128;
const SPLAT_RADIUS = 0.22;
const SPLAT_FORCE = 35;
const CURL_STRENGTH = 0;
const PRESSURE_ITERATIONS = 3;
const VELOCITY_DISSIPATION = 0.98;
const PRESSURE_DISSIPATION = 0.86;

type DoubleRT = { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget; swap(): void };

function doubleRT(filter: THREE.MagnificationTextureFilter): DoubleRT {
  const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, magFilter: filter, minFilter: filter, depthBuffer: false };
  const rt = {
    read: new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, opts),
    write: new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, opts),
    swap() {
      const t = rt.read;
      rt.read = rt.write;
      rt.write = t;
    },
  };
  return rt;
}

function raw(vertexShader: string, fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
  return new THREE.RawShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false });
}

export function fullscreenTriangle() {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  return g;
}

export class FluidSim {
  readonly velUniform: THREE.IUniform<THREE.Texture | null> = { value: null };
  readonly pointer = new THREE.Vector2(0.5, 0.5);

  private velocity = doubleRT(THREE.LinearFilter);
  private pressure = doubleRT(THREE.NearestFilter);
  private divergence = new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, {
    type: THREE.HalfFloatType,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    depthBuffer: false,
  });
  private curl = this.divergence.clone();
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mesh: THREE.Mesh;
  private texel = new THREE.Vector2(1 / SIM_RES, 1 / SIM_RES);
  private prev = new THREE.Vector2(0.5, 0.5);
  private lastUpdate = 0;
  private lastSplat = 0;
  private delta = new THREE.Vector2();

  private mClear = raw(F.clearVert, F.clearFrag, { texelSize: { value: this.texel }, uTexture: { value: null }, value: { value: PRESSURE_DISSIPATION } });
  private mSplat = raw(F.splatVert, F.splatFrag, {
    texelSize: { value: this.texel },
    uTarget: { value: null },
    aspectRatio: { value: 1 },
    color: { value: new THREE.Vector3() },
    point: { value: new THREE.Vector2() },
    prevPoint: { value: new THREE.Vector2() },
    radius: { value: SPLAT_RADIUS },
    isDye: { value: false },
  });
  private mCurl = raw(F.curlVert, F.curlFrag, { texelSize: { value: this.texel }, uVelocity: { value: null } });
  private mVorticity = raw(F.vorticityVert, F.vorticityFrag, {
    texelSize: { value: this.texel },
    uVelocity: { value: null },
    uCurl: { value: null },
    curl: { value: CURL_STRENGTH },
    dt: { value: 1 / 60 },
  });
  private mDivergence = raw(F.divergenceVert, F.divergenceFrag, { texelSize: { value: this.texel }, uVelocity: { value: null } });
  private mPressure = raw(F.pressureVert, F.pressureFrag, {
    texelSize: { value: this.texel },
    uPressure: { value: null },
    uDivergence: { value: null },
  });
  private mGradient = raw(F.gradientSubtractVert, F.gradientSubtractFrag, {
    texelSize: { value: this.texel },
    uPressure: { value: null },
    uVelocity: { value: null },
  });
  private mAdvection = raw(F.advectionVert, F.advectionFrag, {
    texelSize: { value: this.texel },
    dyeTexelSize: { value: this.texel },
    uVelocity: { value: null },
    uSource: { value: null },
    dt: { value: 1 / 60 },
    dissipation: { value: 1 },
  });

  constructor() {
    this.mesh = new THREE.Mesh(fullscreenTriangle(), this.mClear);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  private pass(renderer: THREE.WebGLRenderer, material: THREE.RawShaderMaterial, target: THREE.WebGLRenderTarget) {
    this.mesh.material = material;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
  }

  update(renderer: THREE.WebGLRenderer, time: number, ratio: number, aspect: number) {
    const autoClear = renderer.autoClear;
    const previousTarget = renderer.getRenderTarget();
    renderer.autoClear = false;

    if (time - this.lastUpdate >= 0.016) {
      this.delta.subVectors(this.pointer, this.prev);
      if (this.delta.length() > 0) {
        const fresh = time - this.lastSplat > 0.15;
        const u = this.mSplat.uniforms;
        u.isDye.value = false;
        u.uTarget.value = this.velocity.read.texture;
        u.aspectRatio.value = aspect;
        u.point.value.copy(this.pointer);
        u.prevPoint.value.copy(fresh ? this.pointer : this.prev);
        u.color.value.set(this.delta.x * aspect, this.delta.y, 0).multiplyScalar(SPLAT_FORCE).multiplyScalar(fresh ? 0 : 1);
        u.radius.value = SPLAT_RADIUS;
        this.pass(renderer, this.mSplat, this.velocity.write);
        this.velocity.swap();
        this.lastSplat = time;
      }
      this.lastUpdate = time;
      this.prev.copy(this.pointer);
    }

    this.mCurl.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(renderer, this.mCurl, this.curl);

    this.mVorticity.uniforms.uVelocity.value = this.velocity.read.texture;
    this.mVorticity.uniforms.uCurl.value = this.curl.texture;
    this.mVorticity.uniforms.dt.value = ratio;
    this.pass(renderer, this.mVorticity, this.velocity.write);
    this.velocity.swap();

    this.mDivergence.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(renderer, this.mDivergence, this.divergence);

    this.mClear.uniforms.uTexture.value = this.pressure.read.texture;
    this.mClear.uniforms.value.value = Math.exp(Math.log(PRESSURE_DISSIPATION) * ratio);
    this.pass(renderer, this.mClear, this.pressure.write);
    this.pressure.swap();

    this.mPressure.uniforms.uDivergence.value = this.divergence.texture;
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      this.mPressure.uniforms.uPressure.value = this.pressure.read.texture;
      this.pass(renderer, this.mPressure, this.pressure.write);
      this.pressure.swap();
    }

    this.mGradient.uniforms.uPressure.value = this.pressure.read.texture;
    this.mGradient.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(renderer, this.mGradient, this.velocity.write);
    this.velocity.swap();

    const a = this.mAdvection.uniforms;
    a.uVelocity.value = this.velocity.read.texture;
    a.uSource.value = this.velocity.read.texture;
    a.dt.value = ratio;
    a.dissipation.value = Math.exp(Math.log(VELOCITY_DISSIPATION) * ratio);
    this.pass(renderer, this.mAdvection, this.velocity.write);
    this.velocity.swap();

    renderer.autoClear = autoClear;
    renderer.setRenderTarget(previousTarget);
    this.velUniform.value = this.velocity.read.texture;
  }

  dispose() {
    [this.velocity.read, this.velocity.write, this.pressure.read, this.pressure.write, this.divergence, this.curl].forEach((rt) => rt.dispose());
    [this.mClear, this.mSplat, this.mCurl, this.mVorticity, this.mDivergence, this.mPressure, this.mGradient, this.mAdvection].forEach((m) =>
      m.dispose(),
    );
    this.mesh.geometry.dispose();
  }
}
