import StarBorder from "./star-border";
import { ShowcaseCell } from "./showcase-cell";
import SectionChrome from "./section-chrome";

const ComponentsShowcase = () => {
  return (
    <>
      <SectionChrome label="COMPONENTS" />
      <div className="grid grid-cols-[50px_1fr_50px] max-sm:grid-cols-[30px_1fr_30px] ">
        <div className=" border-r border-muted relative overflow-hidden">
          <StarBorder />
        </div>
        <div className=" overflow-hidden">
          <div className="relative h-10 text-xs tracking-wider text-muted-foreground">
            <StarBorder />
          </div>
          <div className="border-y border-muted grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            <ShowcaseCell source="buttons" className="  border  border-muted" />
            <ShowcaseCell source="svg" className="  border  border-muted" />
            <ShowcaseCell source="mouse" className="  border  border-muted" />
            <ShowcaseCell source="border" className="  border  border-muted" />
            <ShowcaseCell source="background" className="  border  border-muted" />
            <ShowcaseCell source="text" className="  border  border-muted" />
          </div>{" "}
          <div className="relative h-10 text-xs tracking-wider text-muted-foreground">
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
