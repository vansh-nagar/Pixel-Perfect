declare module "flubber" {
  interface Options {
    maxSegmentLength?: number;
    string?: boolean;
  }
  /** Interpolator between two SVG path `d` strings: `t` 0 → 1 returns a path. */
  export function interpolate(
    fromShape: string,
    toShape: string,
    options?: Options,
  ): (t: number) => string;
  export function toCircle(
    fromShape: string,
    cx: number,
    cy: number,
    r: number,
    options?: Options,
  ): (t: number) => string;
  export function separate(
    fromShape: string,
    toShapes: string[],
    options?: Options,
  ): (t: number) => string[];
}
