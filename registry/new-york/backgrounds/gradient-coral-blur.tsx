/**
 * A coral linear gradient with a faint backdrop blur.
 */
export default function GradientCoralBlur() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(137.47deg, #FF6D5E 11.08%, #FF9186 42.04%, #FF5948 95.9%)",
          backdropFilter: "blur(0.75px)",
      }}
    />
  );
}
