/**
 * A warm sunset glow with a soft red inner shadow.
 */
export default function GradientSunsetGlow() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(0.1deg, rgba(255, 74, 74, 0) 0.09%, rgba(255, 36, 36, 0.2) 76.39%), linear-gradient(360deg, #FFF16E 2.67%, #FF8A33 30.48%, #FF4A4A 51.8%), #FF4A4A",
      }}
    />
  );
}
