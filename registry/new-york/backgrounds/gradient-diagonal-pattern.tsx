/**
 * A fine diagonal repeating-line micro pattern.
 */
export default function GradientDiagonalPattern() {
  return (
    <div className="bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px] h-full w-full absolute inset-0" />
  );
}
