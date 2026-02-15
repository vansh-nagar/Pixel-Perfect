"use client";
import { Button } from "@/components/ui/button";
import MorphButton from "../../../../registry/new-york/buttons/morph-button";
import MorphImageButton from "../../../../registry/new-york/buttons/morph-image-button";
import ThreedButton from "../../../../registry/new-york/buttons/3d-button";
import ShinyButton from "../../../../registry/new-york/buttons/shiny-button";
import BorderGradientButton from "../../../../registry/new-york/buttons/border-gradient-button";
import MouseFollowerButton from "../../../../registry/new-york/buttons/mouse-follower-button";
import PremiumButton from "../../../../registry/new-york/buttons/premium-button";
import OrangePremiumButton from "../../../../registry/new-york/buttons/orange-premium-button";
import StripeButton from "../../../../registry/new-york/buttons/stripe-button";
import LearnMoreButtion from "../../../../registry/new-york/buttons/learn-more-buttion";
import ToggleButton from "../../../../registry/new-york/buttons/toggle-buttion";
import AbhinavBentoButton from "../../../../registry/new-york/buttons/abhinav-bento-button";
import VisitButton from "../../../../registry/new-york/buttons/visit-button";
import { Spinner } from "@/components/ui/spinner";
import GooeyButton from "registry/new-york/buttons/goe-button";
import BlurToggleButton from "../../../../registry/new-york/buttons/blur-toggle-button";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CopyDropdown from "../copy-dropdown";

const ToggleButtonWrapper = () => {
  const [toggle, setToggle] = useState(false);
  return <ToggleButton toggle={toggle} setToggle={setToggle} />;
};

export const ButtonsArr = [
  {
    name: "Morph Button",
    description: "A button that morphs its shape on hover using GSAP.",
    component: <MorphButton>Hover Me</MorphButton>,
    registryName: "morph-button",
  },
  {
    name: "Morph Image Button",
    description: "A button that morphs an image mask on hover using GSAP.",
    component: <MorphImageButton>Hover Me</MorphImageButton>,
    registryName: "morph-image-button",
  },
  {
    name: "3D Button",
    description: "A 3D button with press and hover effects.",
    component: <ThreedButton>Click Me</ThreedButton>,
    registryName: "3d-button",
  },
  {
    name: "Shiny Button",
    description: "A shiny button with hover effects.",
    component: <ShinyButton />,
    registryName: "shiny-button",
  },
  {
    name: "Mouse Follower Button",
    description: "A button that follows the mouse cursor with hover effects.",
    component: <MouseFollowerButton>Mouse follower</MouseFollowerButton>,
    registryName: "mouse-follower-button",
  },
  {
    name: "Border Gradient Button",
    description: "A button with a gradient border effect.",
    component: <BorderGradientButton />,
    registryName: "border-gradient-button",
  },
  {
    name: "Premium Button",
    description: "A button with elaborate shadows and premium feel.",
    component: <PremiumButton>Hover Me</PremiumButton>,
    registryName: "premium-button",
  },
  {
    name: "Orange Premium Button",
    description: "A button with vibrant gradients and soft shadows.",
    component: <OrangePremiumButton>Hover Me</OrangePremiumButton>,
    registryName: "orange-premium-button",
  },
  {
    name: "Stripe Button",
    description: "A Stripe-inspired button with inset shadow effect.",
    component: <StripeButton>Click Me</StripeButton>,
    registryName: "stripe-button",
  },
  {
    name: "Learn More Button",
    description: "An animated learn more button with hover effects.",
    component: <LearnMoreButtion />,
    registryName: "learn-more-button",
  },
  {
    name: "Visit Button",
    description: "A compact button with label and icon swap on hover.",
    component: <VisitButton />,
    registryName: "visit-button",
  },
  {
    name: "Toggle Button",
    description: "An animated toggle switch with spring physics.",
    component: <ToggleButtonWrapper />,
    registryName: "toggle-button",
  },
  {
    name: "Abhinav Bento Button",
    description: "A large bento-style button.",
    component: (
      <AbhinavBentoButton>
        <Spinner />
      </AbhinavBentoButton>
    ),
    registryName: "abhinav-bento-button",
  },
  {
    name: "Gooey Button",
    description: "A gooey SVG filter button effect.",
    component: <GooeyButton />,
    registryName: "goe-button",
  },
  {
    name: "Blur Toggle Button",
    description: "A button with blur transition effect on toggle.",
    component: <BlurToggleButton />,
    registryName: "blur-toggle-button",
  },
];

const ButtonGrid = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(ButtonsArr.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = ButtonsArr.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
        {paginatedItems.map((item, index) => (
          <div
            key={index}
            className="relative group border-b border-l border-dashed  aspect-square flex items-center justify-center "
          >
            <BorderDecorator />
            <div className=" z-30">{item.component}</div>

            <div className=" leading-1 absolute left-1.5  bottom-1.5 p-0.5">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>

            <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
              <div className=" border-t border-dashed "></div>
              <CopyDropdown registryName={item.registryName} />
              <div />
              <div className=" border-r border-dashed h-full -mr-[0.5px] " />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-none border-dashed ${
                  currentPage === page ? "" : ""
                }`}
              >
                {page}
              </Button>
            ))}
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

export default ButtonGrid;

export const BorderDecorator = () => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-[0.5px] -top-[0px] block size-6   border-dashed border-l-1 border-t-1 z-30"></span>
      <span className="border-muted-foreground absolute -right-px -top-px block size-6 border-dashed border-r-1 border-t-1 z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -left-[0.5px] block size-6 border-dashed border-b-1 border-l-1 z-30 "></span>
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-6 border-b-1 border-r-1 border-dashed z-30"></span>

      <span className="absolute -top-px -right-[0.5px] z-30 border-b border-l block size-2 px-[38px] py-[20px] mt-[1px]  border-dashed"></span>

      {/* Circular border */}
      <div className="absolute group-hover:animate-spin top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none"></div>

      {/* Horizontal line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-y-1/2 z-10 pointer-events-none"></div>

      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-x-1/2 z-10 pointer-events-none"></div>
    </>
  );
};
