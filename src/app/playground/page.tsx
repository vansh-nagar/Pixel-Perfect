import { Navbar } from "@/components/mine/landing-page/navbar";
import { LightDarkMode } from "@/components/ui/light-dark-mode";

const Page = () => {
  return (
    <div className=" min-h-screen">
      <div className=" fixed top-4 right-4">
        <LightDarkMode />
      </div>{" "}
    </div>
  );
};

export default Page;
