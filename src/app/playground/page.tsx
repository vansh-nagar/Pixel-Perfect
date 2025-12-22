import MouseFollower2 from "@/components/pixel-perfect/mouse-follower2";
import { LightDarkMode } from "@/components/ui/light-dark-mode";

const Page = () => {
  return (
    <div className=" min-h-screen">
      <div className=" fixed top-4 right-4">
        <LightDarkMode />
      </div>
      <MouseFollower2 />
    </div>
  );
};

export default Page;
