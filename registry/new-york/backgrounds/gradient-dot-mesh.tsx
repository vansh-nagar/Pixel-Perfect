/**
 * A fixed radial dot-mesh texture with a subtle inset ring.
 */
export default function GradientDotMesh() {
  return (
    <div className="absolute inset-0 after:pointer-events-none after:inset-0 after:inset-ring after:inset-ring-gray-950/5 dark:after:inset-ring-white/10 bg-[radial-gradient(var(--pattern-fg)_1px,transparent_0)] bg-size-[10px_10px] bg-fixed [--pattern-fg:var(--color-gray-950)]/5 dark:[--pattern-fg:var(--color-white)]/10" />
  );
}
