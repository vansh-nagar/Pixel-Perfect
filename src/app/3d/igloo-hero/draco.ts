import * as THREE from "three";

const DECODER_PATH = "/_study/libs/draco/";

const ARRAY_TYPES = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
] as const;

type DracoAttribute = { num_components(): number };
type DracoGeometry = { ptr: number; num_points(): number; num_faces?(): number };
type DracoStatus = { ok(): boolean; error_msg(): string };
type DracoDecoder = {
  GetEncodedGeometryType(buffer: Int8Array): number;
  DecodeArrayToMesh(buffer: Int8Array, length: number, mesh: DracoGeometry): DracoStatus;
  DecodeArrayToPointCloud(buffer: Int8Array, length: number, cloud: DracoGeometry): DracoStatus;
  GetMetadata(geometry: DracoGeometry): unknown;
  GetAttributeByUniqueId(geometry: DracoGeometry, id: number): DracoAttribute;
  GetAttributeDataArrayForAllPoints(
    geometry: DracoGeometry,
    attribute: DracoAttribute,
    dataType: number,
    byteLength: number,
    ptr: number,
  ): boolean;
  GetTrianglesUInt32Array(geometry: DracoGeometry, byteLength: number, ptr: number): boolean;
};
type DracoQuerier = { HasEntry(md: unknown, key: string): boolean; GetStringEntry(md: unknown, key: string): string };
type DracoModule = {
  TRIANGULAR_MESH: number;
  Decoder: new () => DracoDecoder;
  Mesh: new () => DracoGeometry;
  PointCloud: new () => DracoGeometry;
  MetadataQuerier: new () => DracoQuerier;
  HEAPF32: Float32Array;
  DT_FLOAT32: number;
  DT_INT8: number;
  DT_INT16: number;
  DT_INT32: number;
  DT_UINT8: number;
  DT_UINT16: number;
  DT_UINT32: number;
  _malloc(bytes: number): number;
  _free(ptr: number): void;
  destroy(obj: unknown): void;
};
type DracoFactory = (config: { wasmBinary: ArrayBuffer; onModuleLoaded: (m: DracoModule) => void }) => void;

let modulePromise: Promise<DracoModule> | null = null;

function loadModule(): Promise<DracoModule> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    const win = window as unknown as { DracoDecoderModule?: DracoFactory };
    if (!win.DracoDecoderModule) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${DECODER_PATH}draco_wasm_wrapper.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load the Draco decoder"));
        document.head.appendChild(script);
      });
    }
    const wasmBinary = await fetch(`${DECODER_PATH}draco_decoder.wasm`).then((r) => r.arrayBuffer());
    return new Promise<DracoModule>((resolve) => {
      win.DracoDecoderModule!({ wasmBinary, onModuleLoaded: resolve });
    });
  })();
  return modulePromise;
}

function dataType(draco: DracoModule, ctor: (typeof ARRAY_TYPES)[number]) {
  switch (ctor) {
    case Float32Array:
      return draco.DT_FLOAT32;
    case Int8Array:
      return draco.DT_INT8;
    case Int16Array:
      return draco.DT_INT16;
    case Int32Array:
      return draco.DT_INT32;
    case Uint8Array:
      return draco.DT_UINT8;
    case Uint16Array:
      return draco.DT_UINT16;
    default:
      return draco.DT_UINT32;
  }
}

function decode(draco: DracoModule, bytes: ArrayBuffer): THREE.BufferGeometry {
  const decoder = new draco.Decoder();
  const buffer = new Int8Array(bytes);
  const isMesh = decoder.GetEncodedGeometryType(buffer) === draco.TRIANGULAR_MESH;
  const geometry = isMesh ? new draco.Mesh() : new draco.PointCloud();
  const status = isMesh
    ? decoder.DecodeArrayToMesh(buffer, buffer.byteLength, geometry)
    : decoder.DecodeArrayToPointCloud(buffer, buffer.byteLength, geometry);
  if (!status.ok() || geometry.ptr === 0) throw new Error(`Draco decode failed: ${status.error_msg()}`);

  const querier = new draco.MetadataQuerier();
  const metadata = decoder.GetMetadata(geometry);
  const info = JSON.parse(querier.GetStringEntry(metadata, "info")) as {
    attributes: [string, number][];
    userData?: Record<string, unknown>;
  };
  draco.destroy(querier);

  const out = new THREE.BufferGeometry();
  info.attributes.forEach(([name, typeIndex], uniqueId) => {
    const Ctor = ARRAY_TYPES[typeIndex];
    const attribute = decoder.GetAttributeByUniqueId(geometry, uniqueId);
    const itemSize = attribute.num_components();
    const count = geometry.num_points() * itemSize;
    const byteLength = count * Ctor.BYTES_PER_ELEMENT;
    const ptr = draco._malloc(byteLength);
    decoder.GetAttributeDataArrayForAllPoints(geometry, attribute, dataType(draco, Ctor), byteLength, ptr);
    const array = new Ctor(draco.HEAPF32.buffer as ArrayBuffer, ptr, count).slice();
    draco._free(ptr);
    out.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  });

  if (isMesh && geometry.num_faces) {
    const count = geometry.num_faces() * 3;
    const byteLength = count * 4;
    const ptr = draco._malloc(byteLength);
    decoder.GetTrianglesUInt32Array(geometry, byteLength, ptr);
    const index = new Uint32Array(draco.HEAPF32.buffer, ptr, count).slice();
    draco._free(ptr);
    out.setIndex(new THREE.BufferAttribute(index, 1));
  }

  if (info.userData) out.userData = info.userData;
  draco.destroy(geometry);
  draco.destroy(decoder);
  return out;
}

const cache = new Map<string, Promise<THREE.BufferGeometry>>();

export function loadDrc(url: string): Promise<THREE.BufferGeometry> {
  let promise = cache.get(url);
  if (!promise) {
    promise = Promise.all([loadModule(), fetch(url).then((r) => r.arrayBuffer())]).then(([draco, bytes]) =>
      decode(draco, bytes),
    );
    cache.set(url, promise);
  }
  return promise;
}
