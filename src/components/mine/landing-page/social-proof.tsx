import { Circle } from "lucide-react";
import StarBorder from "./star-border";
import { TweetCard } from "@/components/ui/tweet-card";

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

const TweetId = [
  "2011459910123630678",
  "2002690740145815768",
  "2012170616183611401",
  "2011770306143404305",
  "2011737191593230700",
  "2002733494146138119",
  "2002733761440694703",
  "2002779757772235197",
  "2003013537430716554",
  "2002718212031643957",
  "2003165560675377431",
  "2002760959069422071",
  "2002726077362528574",
  "2013248082784530701",
  "2016251647551304023",
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
