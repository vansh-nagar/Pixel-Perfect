/**
 * A soft sky: a cloud photo blurred 12.5px, fading out toward the bottom over white, with a white glow at the edges.
 */

/*
 * No WebGL, just CSS on one photo. The photo overhangs the box by 5% on every side so the blur
 * never pulls transparent edges in. The fade runs from opaque at the top to 20% two thirds of the
 * way down, then out to nothing, so the sky never ends on a line.
 */

const FADE = "linear-gradient(to bottom, #000, rgb(0 0 0 / 0.2) 66%, transparent)";

export default function CloudSky({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`relative overflow-hidden bg-white ${className ?? ""}`}>
      <div className="absolute inset-0" style={{ maskImage: FADE, WebkitMaskImage: FADE }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/clouds/sky.png"
          alt=""
          className="absolute -top-[5%] -left-[5%] h-[110%] w-[110%] max-w-none object-cover blur-[12.5px]"
        />
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_54px_0_rgba(255,255,255,0.6)]" />
    </div>
  );
}
