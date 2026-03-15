"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import CardAnimation from "registry/new-york/motion-framer/card-animation";
import ImageHoverAnimation from "registry/new-york/motion-framer/image-hover-animation";
import LogoAnimation from "registry/new-york/motion-framer/logo-animation";
import SuccessRippleAnimation from "registry/new-york/motion-framer/success-ripple-animation";
import TabBackgroundAnimation from "registry/new-york/motion-framer/tab-background-animation";
import OrbitDotMotion from "registry/new-york/motion-framer/orbit-dot-motion";
import CoinSpinAnimation from "registry/new-york/motion-framer/coin-spin-animation";
import CopyDropdown from "../copy-dropdown";

const MotionComponentArr = [
  {
    name: "Simple Card",
    description: "A simple card animation using Framer Motion.",
    component: <CardAnimation />,
    registryName: "card-animation",
  },
  {
    name: "Logo Animation",
    description: "Logo animation with Framer Motion and custom background.",
    component: <LogoAnimation />,
    registryName: "logo-animation",
  },
  {
    name: "Tab Background",
    description: "A tab background animation using Framer Motion.",
    component: <TabBackgroundAnimation />,
    registryName: "tab-background-animation",
  },
  {
    name: "Image Hover",
    description: "An image hover animation with scaling and opacity effects.",
    component: <ImageHoverAnimation />,
    registryName: "image-hover-animation",
  },
  {
    name: "Success Ripple",
    description: "Looping ripple pulses with a springy success check reveal.",
    component: <SuccessRippleAnimation />,
    registryName: "success-ripple-animation",
  },
  {
    name: "Orbit Dot",
    description:
      "3D orbiting dot with perspective and constant angular velocity.",
    component: <OrbitDotMotion />,
    registryName: "orbit-dot-motion",
    isNew: true,
  },
  {
    name: "Coin Spin",
    description: "3D spinning coin with layered faces and side profile.",
    component: <CoinSpinAnimation />,
    registryName: "coin-spin-animation",
    isNew: true,
  },
];

const MotionAnimationsGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});

  const handleRefresh = (index: number) => {
    setRefreshKeys((prev) => ({ ...prev, [index]: (prev[index] || 0) + 1 }));
  };
  const itemsPerPage = 2;
  const totalPages = Math.ceil(MotionComponentArr.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = MotionComponentArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
        {paginatedItems.map((item, index) => (
          <div
            key={startIndex + index}
            className="relative w-full border-b border-l border-dashed aspect-square flex justify-center items-center"
          >
            <div className="z-30" key={refreshKeys[startIndex + index] || 0}>
              {item.component}
            </div>

            <div className="absolute left-1.5 top-1.5 z-40 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-none text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => handleRefresh(startIndex + index)}
              >
                <RefreshCcw className="size-3" />
              </Button>

              {item.isNew && (
                <span className="border border-emerald-500/50 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-emerald-600">
                  New
                </span>
              )}
            </div>

            <div className=" leading-1 absolute left-1.5  bottom-1.5">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>

            <div className="absolute inset-x-0 top-0 grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-2">
              <div className="border-t border-dashed" />
              <CopyDropdown registryName={item.registryName} variant="ghost" />
              <div />
              <div className="h-full border-r border-dashed -mr-[0.5px]" />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="border-dashed rounded-none"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 rounded-none border-dashed"
                >
                  {page}
                </Button>
              ),
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="border-dashed rounded-none"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MotionAnimationsGrid;
