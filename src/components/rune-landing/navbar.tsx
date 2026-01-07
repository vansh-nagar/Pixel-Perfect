import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import { Github, Heart, Twitter } from "lucide-react";
import { LightDarkMode } from "../ui/light-dark-mode";

const Navbar = () => {
  return (
    <div className="fixed inset-x-[25px] py-5 flex justify-between z-50">
      <Image
        src="/logo/static/logo.svg"
        alt="Pixel Perfect Logo"
        width={100}
        height={100}
        className="w-12 aspect-square dark:invert -mr-1"
      />
      <div className="flex justify-center items-center gap-2">
        {/* <LightDarkMode /> */}
        <Button
          size={"icon"}
          variant={"outline"}
          className="rounded-full size-10"
        >
          <Github />
        </Button>
        <Button
          size={"icon"}
          variant={"outline"}
          className="rounded-full size-10"
        >
          <Twitter />
        </Button>
        <Button variant={"outline"} className="rounded-full h-10">
          Support Us
          <Heart />
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
