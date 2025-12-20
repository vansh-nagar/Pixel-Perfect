import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ButtonGrid from "../grids/button-grid";

const navItems = [
  {
    name: "Buttons",
    component: <ButtonGrid />,
  },
  {
    name: "Border",
    component: (
      <>
        <div>border</div>
      </>
    ),
  },
];

export function TabsNavigation() {
  return (
    <Tabs defaultValue="Buttons" className="w-full ">
      <TabsList className="flex gap-4  overflow-x-auto overflow-y-hidden   w-full mask-r-from-98%">
        {navItems.map((item) => (
          <TabsTrigger
            className="z-50 cursor-pointer group"
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
