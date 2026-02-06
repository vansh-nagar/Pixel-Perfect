import { Check, Circle } from "lucide-react";
import StarBorder from "./mine/landing-page/star-border";
import MouseFollowerButton from "registry/new-york/buttons/mouse-follower-button";
import Link from "next/link";

export default function Pricing() {
  return (
    <div className="relative overflow-hidden">
      <StarBorder />
      <div className="flex justify-between relative overflow-hidden px-6 py-3 max-sm:px-3 border-b border-muted">
        <div className="flex gap-2">
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
        </div>
        <div className="text-xs text-muted-foreground/30">SUPPORT</div>
        <StarBorder />
      </div>
      <div className="mx-auto grid grid-rows-[auto_auto] ">
        <div className=" text-center relative overflow-hidden w-full py-10">
          <StarBorder />
          <h2 className="text-3xl font-medium md:text-4xl lg:text-5xl">
            Support Pixel Perfect UI Library
          </h2>
        </div>
        <div className="overflow-hidden relative">
          <div className="relative border-t  border-muted">
            <div className="grid items-center divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="pb-12 text-center md:py-10 md:pr-12  border-muted relative overflow-hidden p-4 ">
                <StarBorder />

                <h3 className="text-3xl font-semibold">Support Creator</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Help us keep the library free for everyone
                </p>

                <span className="mb-6 mt-6 inline-block text-6xl">
                  <span className="text-2xl">$</span>3
                </span>

                <div className="flex justify-center">
                  <Link
                    href={
                      "https://buy.polar.sh/polar_cl_f2wnG1ytyvuNI3PIlhnvmlIm3Z7IKK25YZeqR49IQbB"
                    }
                  >
                    <MouseFollowerButton>Donate Now</MouseFollowerButton>
                  </Link>
                </div>

                <p className="text-muted-foreground mt-6 text-xs">
                  Your donation helps us maintain the library, <br />
                  add new components, and keep it open source
                </p>
              </div>
              <div className="relative h-full flex  justify-center items-center overflow-hidden p-4">
                <StarBorder />
                <ul role="list" className="space-y-4">
                  {[
                    "Support ongoing development & maintenance",
                    "Keep the library free & open-source",
                    "Help us create more premium components",
                    "Contribute to the developer community",
                    "Get featured as a supporter",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check size={16} />
                      <span className=" max-sm:text-xs text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
