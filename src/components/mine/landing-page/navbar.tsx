"use client";
import { Button } from "@/components/ui/button";
import { GithubIcon, Moon, Sun, TwitterIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

const links = [
  {
    name: "Components",
    href: "/components",
  },
  {
    name: "Templates",
    href: "/templates",
  },
  {
    name: "Pricing",
    href: "/pricing",
  },
];

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  return (
    <div className="  fixed top-0 inset-x-0 flex justify-between items-center px-20 py-4 font-pixelify bg-background z-50  ">
      <div className=" flex items-center gap-6">
        <Link href={"/"}>
          <img
            src="/logo/final-light.png"
            alt="PIXEL PERFECT"
            className="w-10 dark:hidden block "
          />
          <img
            src="/logo/final-dark.png"
            alt="PIXEL PERFECT"
            className="w-10 hidden dark:block "
          />
        </Link>
        <div>
          {links.map((link) => (
            <a key={link.name} href={link.href} className="mx-4">
              {link.name}
            </a>
          ))}
        </div>
      </div>
      <div className=" flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <TwitterIcon size={16} />
        </Button>
        <Button variant="ghost">
          <GithubIcon size={16} /> 1.1k
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
