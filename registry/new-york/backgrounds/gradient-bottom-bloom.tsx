/**
 * A radial bloom rising from the bottom of the frame.
 */
export default function GradientBottomBloom() {
  return (
    <div className="bg-[radial-gradient(circle_at_bottom,var(--color-1),var(--color-2))] absolute inset-0" />
  );
}
