/**
 * Radial glow that fades from a blue bloom at the top into white.
 */
export default function GradientGlowFade() {
  return (
    <div
      aria-hidden
      className="absolute z-30 inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,var(--color-blue-600),var(--color-white)_100%)]"
    />
  );
}
