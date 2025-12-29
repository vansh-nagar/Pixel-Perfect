import { ComponentTransition } from "@/components/ui/infinite-moving-components";
import { ButtonsArr } from "../grids/button-grid";
import StarBorder from "./star-border";
import { Circle } from "lucide-react";
import { BorderArr } from "../grids/border-grid";
import { TextArr } from "../grids/text-grid";

const ComponentsShowcase = () => {
  return (
    <>
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
        <div className="text-xs text-muted-foreground/30">COMPONENTS</div>
        <StarBorder />
      </div>
      <div className="grid grid-cols-[50px_1fr_50px] max-sm:grid-cols-[30px_1fr_30px] ">
        <div className=" border-r border-muted relative overflow-hidden">
          <StarBorder />
        </div>
        <div className=" overflow-hidden">
          <div className="relative h-10 text-xs text-muted-foreground/30">
            <StarBorder />
          </div>
          <div className=" flex border-y border-muted">
            <ComponentTransition componentArr={ButtonsArr} className="  border-r border-muted" />
            <ComponentTransition componentArr={BorderArr}  className="  border-r border-muted"/>
            <ComponentTransition componentArr={TextArr} />
          </div>{" "}
          <div className="relative h-10 text-xs text-muted-foreground/30">
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
