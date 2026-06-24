import { Circle } from "lucide-react";
import StarBorder from "./star-border";
import { TweetCard } from "@/components/ui/tweet-card";
import TweetId from "@/data/tweets/ids.json";

const SocialProof = () => {
  return (
    <div>
      <div className="flex justify-between relative overflow-hidden px-6 py-3">
        <div className="flex gap-2">
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
          <Circle
            strokeWidth={1}
            size={15}
            className="text-muted-foreground/30"
          />
        </div>
        <div className="text-xs text-muted-foreground/30">LOVED BY MANY</div>
        <StarBorder />
      </div>
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
