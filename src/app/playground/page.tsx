import React from "react";

const Page = () => {
  return (
    <div className="h-screen w-full flex justify-center items-center">
      <button
        className="relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-white cursor-pointer"
        style={{
          background:
            "linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(16, 191, 255, 0.6) 52.26%, rgba(255, 255, 255, 0.6) 100%)",
          borderRadius: "100px",
          border: "none",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[3px] rounded-[100px]"
          style={{
            background:
              "linear-gradient(263.57deg, rgba(199, 240, 255, 0.4) 10.17%, rgba(0, 187, 255, 0.4) 48.94%, rgba(199, 240, 255, 0.4) 103.12%)",
            boxShadow:
              "0px 36.8581px 13.9806px rgba(94, 212, 255, 0.02), 0px 20.3355px 12.7097px rgba(94, 212, 255, 0.08), 0px 8.89677px 8.89677px rgba(94, 212, 255, 0.13), 0px 2.54194px 5.08387px rgba(94, 212, 255, 0.15)",
            backdropFilter: "blur(4.5px)",
          }}
        />
        <span className="relative z-10">Button</span>
      </button>
    </div>
  );
};

export default Page;
