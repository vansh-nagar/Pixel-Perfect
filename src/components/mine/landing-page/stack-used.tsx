import { InfiniteMovingStack } from "@/components/ui/infinite-moving-techstack";
import StarBorder from "./star-border";

const StackUsed = () => {
  return (
    <div className=" flex flex-row overflow-hidden ">
      <div className="border-r border-muted h-32  w-52 max-sm:h-20 max-sm:text-xs flex items-center justify-center relative overflow-hidden">
        Built With <br /> Modern Stack
        <StarBorder />
      </div>
      <div className=" relative overflow-hidden w-full">
        <StarBorder />
        <InfiniteMovingStack speed="slow" />
      </div>
    </div>
  );
};

export default StackUsed;
