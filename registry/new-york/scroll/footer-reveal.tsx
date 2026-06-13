"use client";

/**
 * A scroll-driven footer reveal — the footer sits pinned in place while the content above slides up to uncover it. Pure CSS sticky, no JS.
 */

const STAGE_H = "h-[40vh]";

const FooterReveal = () => {
  return (
    <div className="relative w-full">
      <div
        className={`relative z-10 h-[100vh] bg-indigo-600 text-white`}
      >
        <span className="absolute left-4 top-4 text-sm font-medium">
          Top Left
        </span>
        <span className="absolute right-4 top-4 text-sm font-medium">
          Top Right
        </span>
        <span className="absolute inset-0 grid place-items-center text-2xl font-bold">
          Content
        </span>
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-medium">
          Bottom
        </span>
      </div>

      <div
        className={`sticky bottom-0 z-0 ${STAGE_H} bg-neutral-950 text-white`}
      >
        <span className="absolute left-4 top-4 text-sm font-medium">
          Top Left
        </span>
        <span className="absolute right-4 top-4 text-sm font-medium">
          Top Right
        </span>
        <span className="absolute inset-0 grid place-items-center text-2xl font-bold">
          Footer
        </span>
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-medium">
          Bottom
        </span>
      </div>
    </div>
  );
};

export default FooterReveal;
