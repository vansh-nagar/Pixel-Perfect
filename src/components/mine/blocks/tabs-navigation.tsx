"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const navItems = [
  "Hero Section",
  "Logo Cloud",
  "Button",
  "Navbar",
  "Gradients",
  "Features",
  "Integrations",
  "Content",
  "Stats",
  "Team",
  "Testimonials",
  "Call To Action",
  "Footer",
  "Pricing",
  "Comparator",
  "Faqs",
  "Login",
  "Sign Up",
];

export function TabsNavigation() {
  return (
    <Tabs defaultValue="Hero Section" className="w-full overflow-hidden ">
      <TabsList className="flex gap-4 pl-12 bg-background overflow-x-auto overflow-y-hidden   w-full mask-r-from-98%">
        {navItems.map((item) => (
          <TabsTrigger key={item} value={item}>
            {item}
          </TabsTrigger>
        ))}
      </TabsList>

      {navItems.map((item) => (
        <TabsContent key={item} value={item} className="mt-6">
          <h2 className="text-2xl font-bold mb-4">{item}</h2>
          <p className="text-muted-foreground">
            Content for {item} section goes here
          </p>
        </TabsContent>
      ))}
    </Tabs>
  );
}
