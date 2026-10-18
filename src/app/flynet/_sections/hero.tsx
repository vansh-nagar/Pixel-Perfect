import { RailDivider } from "@/app/flynet/_shell/frame";

const A = "/flynet/hero";

const NAV_LINKS = ["Restaurants", "Ecosystem", "SuperFly", "Resources"];

type LogoPart = { src: string; inset?: string };
type LogoDef = { width: number; parts: LogoPart[] };

// Each logo is a 24px-tall box; parts are placed with Figma's inset percentages (top right bottom left).
const LOGOS: LogoDef[] = [
  {
    width: 130,
    parts: [
      { src: "l1-mark.svg", inset: "0 81.48% 0 0" },
      { src: "l1-type.svg", inset: "17.5% 0 0 24.07%" },
    ],
  },
  { width: 74, parts: [{ src: "l2.svg" }] },
  {
    width: 142,
    parts: [
      { src: "l3-mark.svg", inset: "0 73.73% 0 0" },
      { src: "l3-type.svg", inset: "22.5% 0.15% 22.35% 30.22%" },
    ],
  },
  {
    width: 129,
    parts: [
      { src: "l4-mark.svg", inset: "0 81.4% 0 0" },
      { src: "l4-type.svg", inset: "12.5% 0.13% 9.2% 24.19%" },
    ],
  },
  {
    width: 169,
    parts: [
      { src: "l5-mark.svg", inset: "0 80.14% 0 0" },
      { src: "l5-type.svg", inset: "20% 0 17.5% 25.18%" },
    ],
  },
  {
    width: 129,
    parts: [
      { src: "l6-mark.svg", inset: "0 81.48% 0 0" },
      { src: "l6-type.svg", inset: "15% 0.13% 6.7% 24.54%" },
    ],
  },
  { width: 42, parts: [{ src: "l7.svg" }] },
];

/* eslint-disable @next/next/no-img-element */

export function Hero() {
  return (
    <div className="flex flex-col pb-[90px] lg:min-h-[1024px]">
      {/* Nav */}
      <nav className="flex h-20 items-center justify-between">
        <a href="#" className="flex items-center gap-3 transition-opacity hover:opacity-70">
          <img src={`${A}/logo.svg`} alt="" width={32} height={32} className="size-8" />
          <span className="text-[24px] leading-7 tracking-[-0.48px] text-black">Flynet</span>
        </a>
        <ul className="hidden items-center gap-12 font-flynet-mono text-[14px] leading-6 text-black uppercase lg:flex">
          {NAV_LINKS.map((label) => (
            <li key={label}>
              <a href="#" className="transition-opacity hover:opacity-60">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#"
          className="flex w-[119px] items-center justify-center rounded-[4px] bg-black/8 px-4 py-1.5 font-flynet-mono text-[14px] leading-6 whitespace-nowrap text-black uppercase backdrop-blur-[12px] transition-colors hover:bg-black/15"
        >
          Read More
        </a>
      </nav>
      <RailDivider />

      {/* Headline */}
      <div className="flex w-full max-w-[817px] flex-col gap-8 pt-24 lg:pt-[432px]">
        <div className="flex flex-col gap-4">
          <h1 className="text-[40px] leading-none font-medium tracking-[-0.04em] text-black md:text-[60px]">
            A payments network
            <br />
            <span className="text-black/60">driving restaurants forward</span>
          </h1>
          <p className="max-w-[817px] text-[16px] leading-[1.4] tracking-[-0.32px] text-[#7d7d7d]">
            The payments network with 2,100 businesses and 240,000 paying customers already on
            Blackbird.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="#"
            className="flex items-center gap-2 rounded-[4px] bg-black p-3 font-flynet-mono text-[14px] leading-5 whitespace-nowrap text-white uppercase transition-colors hover:bg-[#333]"
          >
            Start Building
            <img src={`${A}/arrow.svg`} alt="" width={24} height={24} className="size-6" />
          </a>
          <a
            href="#"
            className="flex h-12 w-[174px] items-center justify-center rounded-[4px] border border-black bg-black/4 px-4 py-3 font-flynet-mono text-[14px] leading-5 whitespace-nowrap text-black uppercase backdrop-blur-[12px] transition-colors hover:bg-black/10"
          >
            Explore apps
          </a>
        </div>
      </div>

      {/* Logo strip */}
      <div className="mt-16 lg:mt-auto">
        <RailDivider />
        <ul className="flex h-[72px] items-center justify-between gap-8 overflow-hidden">
          {LOGOS.map((logo, i) => (
            <li
              key={i}
              style={{ width: logo.width }}
              className={`relative h-6 shrink-0 ${i > 4 ? "hidden lg:block" : i > 2 ? "hidden md:block" : i > 1 ? "hidden sm:block" : ""}`}
            >
              {logo.parts.map((p) => (
                <div key={p.src} className="absolute" style={{ inset: p.inset ?? "0" }}>
                  <img src={`${A}/${p.src}`} alt="" className="block size-full max-w-none" />
                </div>
              ))}
            </li>
          ))}
        </ul>
        <RailDivider className="-translate-y-px" />
      </div>
    </div>
  );
}

export function HeroBackground() {
  return (
    <div className="absolute inset-x-0 top-0 h-[707px] overflow-clip rounded-b-[16px] bg-linear-to-b from-[#5b86bb] from-0% via-[#f4f4f4] via-78% to-[#f4f4f4]">
      <img
        src={`${A}/sky.jpg`}
        alt=""
        className="absolute top-0 left-1/2 h-[828px] w-[max(1518px,100%)] -translate-x-1/2 object-cover mix-blend-soft-light"
      />
      <img
        src={`${A}/clouds.png`}
        alt=""
        className="absolute top-[15px] left-1/2 h-[813px] w-[max(1440px,100%)] -translate-x-1/2 object-cover"
      />
      <img
        src={`${A}/sky.jpg`}
        alt=""
        className="absolute top-0 left-1/2 h-[828px] w-[max(1518px,100%)] -translate-x-1/2 object-cover mix-blend-soft-light"
      />
      <img
        src={`${A}/clouds.png`}
        alt=""
        className="absolute top-0 left-1/2 h-[813px] w-[max(1440px,100%)] -translate-x-1/2 object-cover"
      />
    </div>
  );
}
