import ParticleChart from "../11/particle-chart";
import CircuitLines from "./circuit-lines";
import Laptop from "./laptop";

const Page = () => {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(90%_70%_at_50%_40%,#3b3ff0_0%,#2a2ccf_45%,#1c1ea3_100%)] p-6">
      <div className="relative w-full max-w-[900px]">
        {/* Lines are drawn on a 1200×800 plate centred on the laptop, scaling with it. */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 aspect-[3/2] w-[133.34%] -translate-x-1/2 -translate-y-1/2">
          <CircuitLines />
        </div>
        <Laptop>
          {/* An app window holding the chart. */}
          <div className="w-full max-w-[572px] overflow-hidden rounded-[20px] bg-[#0b0d3c] shadow-[0_30px_60px_-20px_rgba(4,5,40,0.7),0_0_0_0.5px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="flex h-8 items-center gap-1.5 px-3">
              <span className="ml-1 size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="flex-1 pr-10 text-center text-[11px] text-white/45">
                Revenue
              </span>
            </div>
            <div className="px-1.5 pb-1.5">
              <ParticleChart radius={14} theme="dark" />
            </div>
          </div>
        </Laptop>
      </div>
    </div>
  );
};

export default Page;
