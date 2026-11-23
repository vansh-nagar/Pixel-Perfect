import StarBorder from "./mine/landing-page/star-border";
import SectionChrome from "./mine/landing-page/section-chrome";
import { LazyVideo } from "./mine/landing-page/lazy-video";

export default function Pricing() {
  return (
    <div className="relative overflow-hidden">
      <StarBorder />
      <SectionChrome label="DEMO" />
      <div className="relative overflow-hidden border-t border-muted">
        <StarBorder />
        <LazyVideo
          src="https://res.cloudinary.com/dz12pywzs/video/upload/q_auto/v1768638799/Timeline_1_tykewr.mp4"
          poster="https://res.cloudinary.com/dz12pywzs/video/upload/so_0,q_auto/v1768638799/Timeline_1_tykewr.jpg"
          className="block w-full aspect-video object-cover"
        />
      </div>
    </div>
  );
}
