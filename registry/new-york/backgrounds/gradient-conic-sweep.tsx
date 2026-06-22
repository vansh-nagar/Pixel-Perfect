/**
 * A layered multi-conic sweep blending black and grey.
 */
export default function GradientConicSweep() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "conic-gradient(from 135deg at 50% 50%, rgba(0, 0, 0, 0) 0deg, #000000 360deg), conic-gradient(from 44.87deg at 50% 50%, rgba(0, 0, 0, 0) 0deg, #000000 360deg), conic-gradient(from -89.88deg at 50% 50%, #FFFFFF 0deg, #999999 360deg)",
      }}
    />
  );
}
