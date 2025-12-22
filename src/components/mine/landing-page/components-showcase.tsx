import { InfiniteMovingComponents } from "@/components/ui/infinite-moving-components";
import { ButtonsArr } from "../grids/button-grid";

const ComponentsShowcase = () => {
  return (
    <div className="  ">
      <InfiniteMovingComponents
        componentArr={ButtonsArr}
        speed={"slow"}
        direction="right"
      />
    </div>
  );
};

export default ComponentsShowcase;
