import { Button } from "@/components/ui/button";
import { LightDarkMode } from "@/components/ui/light-dark-mode";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LucideGithub } from "lucide-react";
import Link from "next/link";
import { FaDiscord, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";

const socialLinks = [
  {
    icon: LucideGithub,
    label: "GitHub",
    href: "#",
  },
  {
    icon: FaXTwitter,
    label: "Twitter",
    href: "#",
  },
  {
    icon: FaLinkedinIn,
    label: "LinkedIn",
    href: "#",
  },
  {
    icon: FaDiscord,
    label: "Discord",
    href: "#",
  },
];

const DocFooter = () => {
  return (
    <div className="flex justify-between gap-2 pt-2  ">
      {" "}
      <div className=" flex gap-2">
        <TooltipProvider>
          {socialLinks.map((social, index) => {
            const IconComponent = social.icon;
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className=" border-dashed"
                    size="icon"
                    asChild
                  >
                    <Link href={social.href}>
                      <IconComponent />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{social.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
      <LightDarkMode />
      <div className="w-full absolute bottom-0 inset-x-0 rounded-2xl h-2 animate-rainbow bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] blur-xl" />
    </div>
  );
};

export default DocFooter;
