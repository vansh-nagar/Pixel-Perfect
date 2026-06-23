"use client";

import { useState } from "react";
import ClaudeSidebar from "../../../../registry/new-york/sidebars/claude-sidebar";
import CopyDropdown from "../copy-dropdown";

const SidebarsArr = [
  {
    name: "Claude Sidebar",
    description:
      "Warm cream sidebar with smooth collapse animation, playful icon micro-interactions, starred & recent chat lists, and user card.",
    component: <ClaudeSidebar />,
    registryName: "claude-sidebar",
  },
];

const SidebarGrid = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SidebarsArr[activeIndex];

  return (
    <div className="relative border border-dashed">
      <div className="flex items-center justify-between gap-3 border-b border-dashed px-3 py-2 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {SidebarsArr.map((item, i) => (
            <button
              key={item.registryName}
              onClick={() => setActiveIndex(i)}
              className={`text-xs px-2.5 py-1 border border-dashed rounded-none cursor-pointer transition-colors ${
                i === activeIndex
                  ? "bg-foreground text-background border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
        <CopyDropdown registryName={active.registryName} />
      </div>

      <div className="relative flex items-stretch min-h-[560px] bg-[repeating-linear-gradient(315deg,var(--pattern-fg)_0,var(--pattern-fg)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px]">
        <div className="z-10 shrink-0">{active.component}</div>
        <div className="flex-1" />
      </div>

      <div className="border-t border-dashed px-3 py-2 leading-tight">
        <p className="text-xs font-medium">{active.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {active.description}
        </p>
      </div>
    </div>
  );
};

export default SidebarGrid;
