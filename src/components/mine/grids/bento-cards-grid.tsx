"use client";

import EventTimelineBentoCard from "registry/new-york/bento-cards/event-timeline-bento-card";
import CopyDropdown from "../copy-dropdown";

const BentoCardsArr = [
  {
    name: "Event Timeline Card",
    description: "Timeline summary card with image, title, and short copy.",
    component: <EventTimelineBentoCard />,
    registryName: "event-timeline-bento-card",
  },
];

const BentoCardsGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {BentoCardsArr.map((item, index) => (
        <div
          key={index}
          className="relative border-b border-l border-dashed aspect-square flex justify-center items-center"
        >
          <div className="z-30 w-full max-w-sm px-4">{item.component}</div>

          <div className="leading-1 absolute left-1.5 bottom-1.5">
            <p className="text-xs">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>
          <div className="absolute inset-x-0 top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
            <div className="border-t border-dashed" />
            <CopyDropdown registryName={item.registryName} variant="ghost" />
            <div />
            <div className="border-r border-dashed h-full -mr-[0.5px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BentoCardsGrid;
