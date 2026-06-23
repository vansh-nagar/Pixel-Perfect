/**
 * A soft silver metallic gradient with a faint backdrop blur.
 */
export default function SilverMetallic() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(137.47deg, rgba(255, 255, 255, 0.3) 11.08%, rgba(248, 250, 255, 0.8) 39.07%, rgba(245, 248, 255, 0.9) 60.7%, rgba(255, 255, 255, 0.2) 95.9%)",
          backdropFilter: "blur(0.5px)",
      }}
    />
  );
}
