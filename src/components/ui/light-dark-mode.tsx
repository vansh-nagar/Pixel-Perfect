"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function LightDarkMode() {
  const { theme, setTheme } = useTheme();

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      className="border-dashed rounded-none"
      size="icon"
      onClick={handleThemeToggle}
    >
      <Sun className=" dark:hidden block" />
      <Moon className=" hidden dark:block" />
    </Button>
  );
}
