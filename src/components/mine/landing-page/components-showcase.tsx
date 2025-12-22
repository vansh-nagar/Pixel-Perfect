import { InfiniteMovingComponents } from "@/components/ui/infinite-moving-components";
import { ButtonsArr } from "../grids/button-grid";
import StarBorder from "./star-border";
import { Circle } from "lucide-react";

const ComponentsShowcase = () => {
  return (
    <>
      <div className="flex justify-between relative overflow-hidden px-6 py-3 border-b border-muted">
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
        <div className="text-xs text-muted-foreground/30">
          ✿ PIXEL PERFECT COMPONENTS ✿
        </div>
        <StarBorder />
      </div>
      <div className="grid grid-cols-[50px_1fr_50px] ">
        <div className=" border-r border-muted relative overflow-hidden">
          <StarBorder />
        </div>
        <div className=" overflow-hidden">
          <div className="relative p-3 text-xs text-muted-foreground/30">
            BUTTONS : [{ButtonsArr.length}]
            <StarBorder />
          </div>
          <InfiniteMovingComponents
            componentArr={ButtonsArr}
            speed={"slow"}
            direction="right"
          />
          <div className="relative p-3 text-xs text-muted-foreground/30">
            BUTTONS : [{ButtonsArr.length}]
            <StarBorder />
          </div>
        </div>
        <div className=" border-l border-muted relative overflow-hidden">
          <StarBorder />
        </div>
      </div>{" "}
    </>
  );
};

export default ComponentsShowcase;
