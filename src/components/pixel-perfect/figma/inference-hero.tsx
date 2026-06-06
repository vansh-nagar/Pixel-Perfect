"use client";

/**
 * Inference hero — focuses on the L-shaped cut-out at the bottom-left.
 *
 * The green panel is a single rounded rectangle. A page-coloured "pocket" is
 * pinned flush to its bottom-left corner, which removes the green there and
 * turns the green into an inverted-L that wraps the two cards on the top and
 * right. Because the pocket shares the box's corner radius (bottom-left) and
 * uses big radii on the inner corners (top-right / bottom-right), the green
 * showing behind those rounded corners reads as the smooth concave cut.
 */

const PAGE = "#f4f4f2"; // page background == the colour that "shows through" the cut-out
const GREEN = "#16271c"; // dark forest panel
const VERDE = "#9de870"; // light-green accent
const INK = "#15241b"; // near-black green used for text on light cards
const CLARO = "#d8f7c0"; // pale-mint "Start Building" card
const PASTEL = "#5b6d3e"; // olive "Get a Demo" card

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 11 11"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.17973 4.94461L4.82729 1.67783L5.59968 0.884766L9.92831 5.10116C9.98134 5.15276 10.0235 5.21447 10.0523 5.28264C10.0811 5.35081 10.0959 5.42406 10.0959 5.49806C10.0959 5.57205 10.0811 5.6453 10.0523 5.71347C10.0235 5.78164 9.98134 5.84335 9.92831 5.89496L5.59968 10.1113L4.82655 9.31828L8.17899 6.05224H0.884857V4.94461H8.17973Z"
      fill="currentColor"
    />
  </svg>
);

type CtaCardProps = {
  title: string;
  href: string;
  cardColor: string;
  textColor: string;
  arrowBg: string;
  arrowColor: string;
};

const CtaCard = ({
  title,
  href,
  cardColor,
  textColor,
  arrowBg,
  arrowColor,
}: CtaCardProps) => (
  <a
    href={href}
    target="_self"
    className="flex h-[150px] w-[268px] flex-row items-start justify-between rounded-[18px] p-5 transition-transform duration-200 hover:-translate-y-0.5"
    style={{ backgroundColor: cardColor }}
  >
    <p
      className="text-[26px] font-bold leading-[1.08] tracking-tight"
      style={{ color: textColor, maxWidth: "7ch" }}
    >
      {title}
    </p>
    <span
      className="flex size-11 shrink-0 items-center justify-center rounded-[12px]"
      style={{ backgroundColor: arrowBg, color: arrowColor }}
    >
      <ArrowIcon className="size-[13px]" />
    </span>
  </a>
);

const InferenceHero = () => {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-6"
      style={{ backgroundColor: PAGE }}
    >
      <section
        className="relative flex h-[620px] w-full max-w-[1180px] flex-col rounded-[40px] p-12"
        style={{ backgroundColor: GREEN }}
      >
        {/* Heading + copy (no illustration, per request) */}
        <h1 className="text-[64px] font-bold leading-[1.02] tracking-tight text-white">
          Inference{" "}
          <span style={{ color: VERDE }} className="whitespace-nowrap">
            On Your Terms
          </span>
        </h1>

        <p className="mt-8 max-w-[45ch] text-[20px] leading-normal text-white/90">
          Inference Platform built for{" "}
          <span style={{ color: VERDE }}>speed and control</span>. Deploy any
          model anywhere, with tailored optimization, efficient scaling, and
          streamlined operations.
        </p>

        {/* The L-shaped cut-out.
            Page-coloured pocket pinned flush to the box's bottom-left corner.
            - bottom-left radius matches the box (40px) so the silhouette stays
              clean and no green slivers leak.
            - big top-right / bottom-right radii reveal the green behind them as
              the concave "L" wrap around the cards. */}
        <div
          className="absolute bottom-0 left-0 w-fit rounded-br-[44px] rounded-tr-[44px] p-3.5"
          style={{ backgroundColor: PAGE }}
        >
          <div className="grid grid-cols-2 gap-3.5">
            <CtaCard
              title="Start Building"
              href="#"
              cardColor={CLARO}
              textColor={INK}
              arrowBg={INK}
              arrowColor={CLARO}
            />
            <CtaCard
              title="Get a Demo"
              href="#"
              cardColor={PASTEL}
              textColor={CLARO}
              arrowBg={CLARO}
              arrowColor={INK}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default InferenceHero;
