
import StarBorder from "./star-border";
import { TweetCard } from "@/components/ui/tweet-card";
import TweetId from "@/data/tweets/ids.json";
import SectionChrome from "./section-chrome";

const SocialProof = () => {
  return (
    <div>
      <SectionChrome label="LOVED BY MANY" bordered={false} />
      <div className="overflow-hidden border-t border-muted">
        <div className="overflow-hidden grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3   ">
          {TweetId.map((id) => (
            <TweetCard key={id} id={id} />
          ))}
          <StarBorder />
        </div>
      </div>
    </div>
  );
};

export default SocialProof;
