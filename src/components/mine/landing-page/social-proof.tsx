import { Circle } from "lucide-react";
import React from "react";
import { InfiniteMovingTweets } from "@/components/ui/infinite-moving-tweets";
import StarBorder from "./star-border";

const tweets = [
  {
    avatar:
      "https://res.cloudinary.com/dz12pywzs/image/upload/v1762336185/Gemini_Generated_Image_qxos2hqxos2hqxos_rlosmn.png",
    name: "Chris DeWeese",
    username: "@chrisdeweese_",
    content:
      '"Started using @pixelperfect for a project, I wish I used this sooner."',
    link: "https://twitter.com",
  },
  {
    avatar:
      "https://res.cloudinary.com/dz12pywzs/image/upload/v1762336185/Gemini_Generated_Image_qxos2hqxos2hqxos_rlosmn.png",
    name: "Sarah Chen",
    username: "@sarahcodes",
    content:
      '"The components from @pixelperfect are absolutely stunning. Saved me hours of work!"',
    link: "https://twitter.com",
  },
  {
    avatar:
      "https://res.cloudinary.com/dz12pywzs/image/upload/v1762336185/Gemini_Generated_Image_qxos2hqxos2hqxos_rlosmn.png",
    name: "Alex Rivera",
    username: "@alexrivera_dev",
    content:
      '"Just discovered @pixelperfect and my UI game has never been stronger. 🔥"',
    link: "https://twitter.com",
  },
  {
    avatar:
      "https://res.cloudinary.com/dz12pywzs/image/upload/v1762336185/Gemini_Generated_Image_qxos2hqxos2hqxos_rlosmn.png",
    name: "Jordan Park",
    username: "@jordanpark",
    content:
      "https://res.cloudinary.com/dz12pywzs/image/upload/v1762336185/Gemini_Generated_Image_qxos2hqxos2hqxos_rlosmn.png",
    link: "https://twitter.com",
  },
  {
    avatar:
      "https://res.cloudinary.com/dz12pywzs/image/upload/v1762336185/Gemini_Generated_Image_qxos2hqxos2hqxos_rlosmn.png",
    name: "Maya Johnson",
    username: "@mayabuilds",
    content:
      '"The attention to detail in @pixelperfect components is next level. Highly recommend!"',
    link: "https://twitter.com",
  },
];

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
        <div className="text-xs text-muted-foreground/30">
          ✿ LOVED BY MANY ✿
        </div>
        <StarBorder />
      </div>
      <div className="grid h-[calc(100vh-100px)] grid-cols-[200px_auto_50px_auto_200px] overflow-hidden border-t border-muted">
        <div className="relative overflow-hidden col-start-1 border-r border-muted">
          <StarBorder />
        </div>
        <div className="relative overflow-hidden col-span-4 border-muted p-4">
          SOCIAL PROOF INCOMMING
          <StarBorder />
        </div>
      </div>
    </div>
  );
};

export default SocialProof;
