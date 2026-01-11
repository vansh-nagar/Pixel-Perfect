import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ButtonGrid from "../grids/button-grid";
import BorderGrid from "../grids/border-grid";
import BackgroundGrid from "../grids/background-grid";
import TextGrid from "../grids/text-grid";
import MouseFollower from "../grids/mouse-follower-grid";
import SvgPathEffectGrid from "../grids/svg-path-effect-grid";

const navItems = [
  {
    name: "Buttons",
    component: <ButtonGrid />,
  },
  {
    name: "Borders & Intersections",
    component: <BorderGrid />,
  },
  {
    name: "Background Gradients, Patterns & Masks",
    component: <BackgroundGrid />,
  },
  {
    name: "Text Effects",
    component: <TextGrid />,
  },
  // {
  //   name: "Image Effects",
  //   component: <ImageGrid />,
  // },
  {
    name: "Mouse Followers",
    component: <MouseFollower />,
  },
  {
    name: "SVG Path Effects",
    component: <SvgPathEffectGrid />,
  },
  // {
  //   name: "Link Hover Effects",
  //   component: <MouseFollower />,
  // },
];

export function TabsNavigation() {
  return (
    <Tabs defaultValue="Buttons" className="w-full ">
      <TabsList className="flex gap-4  overflow-x-auto overflow-y-hidden   w-full mask-r-from-98%">
        {navItems.map((item) => (
          <TabsTrigger
            className="z-50 cursor-pointer group text-xs"
            key={item.name}
            value={item.name}
          >
            {item.name}
            <div className="border-t border-dashed group-data-[state=active]:border-foreground mask-x-to-98%" />
          </TabsTrigger>
        ))}
      </TabsList>
      <div className=" border-t border-dashed mask-x-from-95%"></div>
      {navItems.map((item) => (
        <TabsContent key={item.name} value={item.name}>
          {item.component}
        </TabsContent>
      ))}
    </Tabs>
  );
}
