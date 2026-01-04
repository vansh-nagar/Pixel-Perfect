import { Button } from "@/components/ui/button";
import { Check, Circle } from "lucide-react";
import Link from "next/link";
import StarBorder from "./mine/landing-page/star-border";

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
        <div className="text-xs text-muted-foreground/30">PRICING</div>
        <StarBorder />
      </div>
      <div className="mx-auto grid grid-rows-[auto_auto] ">
        <div className=" text-center relative overflow-hidden w-full py-10">
          <StarBorder />
          <h2 className="text-balance text-3xl font-semibold md:text-4xl lg:text-5xl">
            Unlock Pixel Perfect UI Library
          </h2>
        </div>
        <div className="overflow-hidden relative">
          <div className="relative border-t  border-muted">
            <div className="grid items-center divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="pb-12 text-center md:py-10 md:pr-12  border-muted relative overflow-hidden p-4 ">
                <StarBorder />

                <h3 className="text-2xl font-semibold">Pixel Perfect Pro</h3>
                <p className="mt-2 text-lg">
                  For designers, developers, and creators
                </p>
                <span className="mb-6 mt-12 inline-block text-6xl">
                  <span className="text-4xl">$</span>3
                </span>

                <div className="flex justify-center">
                  <Button asChild size="lg">
                    <Link href="#">Get Pixel Perfect</Link>
                  </Button>
                </div>

                <p className="text-muted-foreground mt-12 text-sm">
                  Includes: All UI components, lifetime updates, commercial{" "}
                  <br /> use, and priority support
                </p>
              </div>
              <div className="relative h-full flex  justify-center items-center overflow-hidden p-4">
                <StarBorder />
                <ul role="list" className="space-y-4">
                  {[
                    "Access to 50+ pixel-perfect components",
                    "One-click copy & paste to your project",
                    "Lifetime free updates",
                    "Commercial license included",
                    "Priority email support",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="size-6" />
                      <span className=" max-sm:text-xs text-left">{item}</span>
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
