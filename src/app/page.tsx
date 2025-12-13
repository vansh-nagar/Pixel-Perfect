import { Footer } from "@/components/mine/landing-page/footer";
import { HeroSection } from "@/components/mine/landing-page/herosection";
import { Navbar } from "@/components/mine/landing-page/navbar";

const page = () => {
  return (
    <div className="px-2 pt-2 flex flex-col gap-2 overflow-hidden noScrollbar">
      <Navbar />
      <HeroSection />
      <Footer />
    </div>
  );
};

export default page;
