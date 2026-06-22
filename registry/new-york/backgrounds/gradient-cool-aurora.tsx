/**
 * A cool aurora of layered blue and cyan radial glows.
 */
export default function GradientCoolAurora() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(45.33% 46.43% at 41.69% 50%, #0140FF 0%, rgba(1, 64, 255, 0) 100%), radial-gradient(28.41% 117.96% at 7.72% 28.75%, #A6FDFF 0%, rgba(255, 255, 255, 0) 100%), radial-gradient(37.39% 69.19% at 107.79% 0%, #0075FF 0%, rgba(0, 66, 255, 0) 100%), radial-gradient(54.38% 89.75% at 83.46% 89.75%, #26F9FF 0%, rgba(0, 69, 255, 0.6) 100%), #0140FF",
      }}
    />
  );
}
