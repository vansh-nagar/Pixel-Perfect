import { TabsNavigation } from "@/components/mine/blocks/tabs-navigation";
import { Navbar } from "@/components/mine/landing-page/navbar";

const Page = () => {
  return (
    <div className="px-[100px] pt-1 overflow-hidden ">
      <Navbar className="px-0" />
      <div className=" border-dashed border-t my-2"></div>
      <TabsNavigation />
    </div>
  );
};

export default Page;
