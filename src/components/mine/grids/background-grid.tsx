"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const Gradient1 = () => (
  <div
    aria-hidden
    className="absolute z-30 inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,var(--color-blue-600),var(--color-white)_100%)]"
  />
);
const Gradient2 = () => (
  <div className="bg-[radial-gradient(circle_at_bottom,var(--color-1),var(--color-2))] absolute inset-0" />
);
const Gradient3 = () => (
  <div className="bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] h-full w-full absolute inset-0"></div>
);
const Gradient4 = () => (
  <div className="h-full w-full relative">
    <div
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 2px, transparent 2px), linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)`,
        backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
        backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
      }}
      className="absolute inset-0 dark:hidden"
    ></div>
    <div
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 2px, transparent 2px), linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)`,
        backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
        backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
      }}
      className="absolute inset-0 hidden dark:block"
    ></div>
  </div>
);
const Gradient5 = () => (
  <div className="absolute inset-0 after:pointer-events-none after:inset-0 after:rounded-lg after:inset-ring after:inset-ring-gray-950/5 dark:after:inset-ring-white/10 bg-[image:radial-gradient(var(--pattern-fg)_1px,_transparent_0)] bg-[size:10px_10px] bg-fixed [--pattern-fg:var(--color-gray-950)]/5 dark:[--pattern-fg:var(--color-white)]/10" />
);

export const BackgroudArr = [
  {
    name: "Gradient 1",
    description: "Radial glow fade",
    component: <Gradient1 />,
  },
  {
    name: "Gradient 2",
    description: "Bottom radial bloom",
    component: <Gradient2 />,
  },
  {
    name: "Gradient 3",
    description: "Diagonal micro pattern",
    component: <Gradient3 />,
  },
  {
    name: "Gradient 4",
    description: "Dual grid system",
    component: <Gradient4 />,
  },
  {
    name: "Gradient 5",
    description: "Dot mesh texture",
    component: <Gradient5 />,
  },
  {
    name: "Gradient 6",
    description: "Purple-blue angled gradient",
    style: {
      background: "linear-gradient(115.43deg, #1A00FF 0%, #9D00FF 100%)",
    },
  },
  {
    name: "Gradient 7",
    description: "Multi-layer conic sweep",
    style: {
      background:
        "conic-gradient(from 135deg at 50% 50%, rgba(0, 0, 0, 0) 0deg, #000000 360deg), conic-gradient(from 44.87deg at 50% 50%, rgba(0, 0, 0, 0) 0deg, #000000 360deg), conic-gradient(from -89.88deg at 50% 50%, #FFFFFF 0deg, #999999 360deg)",
    },
  },
  {
    name: "Gradient 8",
    description: "Sunset glow with inner shadow",
    style: {
      background:
        "linear-gradient(0.1deg, rgba(255, 74, 74, 0) 0.09%, rgba(255, 36, 36, 0.2) 76.39%), linear-gradient(360deg, #FFF16E 2.67%, #FF8A33 30.48%, #FF4A4A 51.8%), #FF4A4A",
      boxShadow:
        "inset 1px -1px 5px rgba(255, 255, 255, 0.4), inset -1px -1px 5px rgba(255, 255, 255, 0.4), inset -2px -2px 5px rgba(255, 255, 255, 0.4), inset 2px -2px 5px rgba(255, 255, 255, 0.4)",
      borderRadius: "12.5px",
    },
  },
  {
    name: "Gradient 9",
    description: "Coral blur with warm shadows",
    style: {
      background:
        "linear-gradient(137.47deg, #FF6D5E 11.08%, #FF9186 42.04%, #FF5948 95.9%)",
      boxShadow:
        "inset -1px -3.25px 9.075px rgba(255, 184, 85, 0.32), inset 0.75px 3px 7.7px rgba(255, 62, 42, 0.43)",
      backdropFilter: "blur(0.75px)",
     
    },
  },
  {
    name: "Gradient 10",
    description: "Cool aurora pill glow",
    style: {
      background:
        "radial-gradient(45.33% 46.43% at 41.69% 50%, #0140FF 0%, rgba(1, 64, 255, 0) 100%), radial-gradient(28.41% 117.96% at 7.72% 28.75%, #A6FDFF 0%, rgba(255, 255, 255, 0) 100%), radial-gradient(37.39% 69.19% at 107.79% 0%, #0075FF 0%, rgba(0, 66, 255, 0) 100%), radial-gradient(54.38% 89.75% at 83.46% 89.75%, #26F9FF 0%, rgba(0, 69, 255, 0.6) 100%), #0140FF",
      border: "0.5px solid #D6FFFE",
      boxShadow:
        "0px 9.36px 7.8px -6.24px #4EF1FF, 0px 9.36px 6.24px -3.12px rgba(0, 73, 255, 0.3), inset 0px 0px 6.24px #00A0FE, inset 0px 0px 9.36px #54FDFF",
      borderRadius: "200px",
    },
  },
  {
    name: "Gradient 11",
    description: "Fiery aurora radial glow",
    style: {
      background:
        "radial-gradient(45.33% 46.43% at 41.69% 50%, #FF4001 0%, rgba(255, 64, 1, 0) 100%), radial-gradient(28.41% 117.96% at 7.72% 28.75%, #FFFDA6 0%, rgba(255, 255, 255, 0) 100%), radial-gradient(37.39% 69.19% at 107.79% 0%, #FF7500 0%, rgba(255, 66, 0, 0) 100%), radial-gradient(54.38% 89.75% at 83.46% 89.75%, #FFF926 0%, rgba(255, 69, 0, 0.6) 100%), #FF4001",
      boxShadow:
        "0px 9.36px 7.8px -6.24px #FFF14E, 0px 9.36px 6.24px -3.12px rgba(255, 73, 0, 0.3), inset 0px 0px 6.24px #FEA000, inset 0px 0px 9.36px #FFFD54",
    },
  },
  {
    name: "Gradient 12",
    description: "Gold metallic sheen",
    style: {
      background:
        "linear-gradient(125.94deg, #AE4E00 0%, #B47E11 25%, #EFD983 39.26%, #FEF1A2 44.41%, #EFD983 49.2%, #BC881B 75%, #A54E07 100%)",
      border: "1px solid rgba(120, 50, 5, 0.6)",
      boxShadow:
        "0px 3px 6px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(110, 80, 20, 0.4), inset 0px -2px 5px 2px #8B4208, inset 0px -1px 1px 4px #FAE385",
      borderRadius: "4px",
    },
  },
  {
    name: "Gradient 14",
    description: "Chrome metallic reflection",
    style: {
      background:
        "linear-gradient(0deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), linear-gradient(0deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0.24)), conic-gradient(from 90deg at 50% 50%, #FDFDFD 0deg, #464646 44.35deg, #2C2C2C 56.43deg, #2C2C2C 63.53deg, #595959 77.78deg, #FDFDFD 101.95deg, #B5B5B5 130.71deg, #2C2C2C 158.9deg, #2F2F2F 170.95deg, #2C2C2C 179.09deg, #595959 197.78deg, #FDFDFD 227.8deg, #CDCDCD 240.9deg, #595959 273.03deg, #696969 300.73deg, #8C8C8C 313.13deg, #FDFDFD 360deg)",
      boxShadow:
        "0px 2px 2px rgba(0, 0, 0, 0.25), 0px 0px 0px 1px rgba(0, 0, 0, 0.75)",
      borderRadius: "100px",
    },
  },
  {
    name: "Gradient 15",
    description: "Purple brushed metal",
    style: {
      background:
        "linear-gradient(99.09deg, rgba(211, 212, 213, 0.15) 12.86%, rgba(139, 145, 147, 0.15) 15.34%, rgba(87, 95, 99, 0.15) 17.82%, rgba(55, 65, 69, 0.15) 18.64%, rgba(43, 54, 58, 0.15) 19.47%, rgba(52, 62, 66, 0.15) 22.77%, rgba(77, 85, 89, 0.15) 26.9%, rgba(117, 123, 126, 0.15) 32.68%, rgba(173, 176, 177, 0.15) 38.46%, rgba(205, 205, 206, 0.15) 41.76%, rgba(198, 199, 200, 0.15) 43.41%, rgba(180, 182, 184, 0.15) 45.06%, rgba(151, 156, 158, 0.15) 46.71%, rgba(111, 118, 122, 0.15) 49.19%, rgba(72, 83, 87, 0.15) 50.84%, rgba(76, 86, 90, 0.15) 52.49%, rgba(89, 98, 102, 0.15) 54.97%, rgba(112, 117, 120, 0.15) 57.45%, rgba(143, 144, 146, 0.15) 59.1%, rgba(152, 152, 154, 0.15) 59.92%, rgba(165, 165, 166, 0.15) 63.23%, rgba(199, 199, 200, 0.15) 70.66%, rgba(255, 255, 255, 0.15) 78.91%, rgba(209, 209, 210, 0.15) 81.39%, rgba(79, 79, 83, 0.15) 87.17%, rgba(27, 27, 32, 0.15) 90.47%, rgba(49, 49, 54, 0.15) 91.3%, rgba(77, 77, 81, 0.15) 92.12%, rgba(116, 116, 118, 0.15) 92.95%, rgba(165, 165, 167, 0.15) 94.6%, rgba(233, 233, 233, 0.15) 95.43%), linear-gradient(0deg, #895DEC, #895DEC), #E8E8E8",
      backgroundBlendMode: "hard-light, normal, normal",
      borderRadius: "100px",
    },
  },
  {
    name: "Gradient 16",
    description: "Steel brushed metal",
    style: {
      background:
        "linear-gradient(99.09deg, rgba(211, 212, 213, 0.18) 12.86%, rgba(139, 145, 147, 0.18) 15.34%, rgba(87, 95, 99, 0.18) 17.82%, rgba(55, 65, 69, 0.18) 18.64%, rgba(43, 54, 58, 0.18) 19.47%, rgba(52, 62, 66, 0.18) 22.77%, rgba(77, 85, 89, 0.18) 26.9%, rgba(117, 123, 126, 0.18) 32.68%, rgba(173, 176, 177, 0.18) 38.46%, rgba(205, 205, 206, 0.18) 41.76%, rgba(198, 199, 200, 0.18) 43.41%, rgba(180, 182, 184, 0.18) 45.06%, rgba(151, 156, 158, 0.18) 46.71%, rgba(111, 118, 122, 0.18) 49.19%, rgba(72, 83, 87, 0.18) 50.84%, rgba(76, 86, 90, 0.18) 52.49%, rgba(89, 98, 102, 0.18) 54.97%, rgba(112, 117, 120, 0.18) 57.45%, rgba(143, 144, 146, 0.18) 59.1%, rgba(152, 152, 154, 0.18) 59.92%, rgba(165, 165, 166, 0.18) 63.23%, rgba(199, 199, 200, 0.18) 70.66%, rgba(255, 255, 255, 0.18) 78.91%, rgba(209, 209, 210, 0.18) 81.39%, rgba(79, 79, 83, 0.18) 87.17%, rgba(27, 27, 32, 0.18) 90.47%, rgba(49, 49, 54, 0.18) 91.3%, rgba(77, 77, 81, 0.18) 92.12%, rgba(116, 116, 118, 0.18) 92.95%, rgba(165, 165, 167, 0.18) 94.6%, rgba(233, 233, 233, 0.18) 95.43%), linear-gradient(273.67deg, #E8E8E8 19.03%, #F9F9F9 80.97%)",
      backgroundBlendMode: "hard-light, normal",
      borderRadius: "16px",
    },
  },
  {
    name: "Nexvyn gradient",
    description: "A simple gradient for Nexvyn",
    style: {
      background:
        "linear-gradient(137.47deg, rgba(255, 255, 255, 0.3) 11.08%, rgba(248, 250, 255, 0.8) 39.07%, rgba(245, 248, 255, 0.9) 60.7%, rgba(255, 255, 255, 0.2) 95.9%)",
      boxShadow:
        "9.25px 13.75px 2px rgba(255, 223, 220, 0.13), inset -1px -3.25px 9.075px #FFFFFF, inset 0.75px 3px 7.7px rgba(255, 213, 209, 0.43)",
      backdropFilter: "blur(0.5px)",
      borderRadius: "11.75px",
    },
  },
  {
    name: "Gradient 18",
    description: "Soft purple-orange radial",
    style: {
      background:
        "radial-gradient(44.02% 44.02% at 14.38% 14.47%, rgba(188, 92, 248, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%), radial-gradient(50.49% 50.49% at 64.54% 12.33%, #EFD0BB 0%, #FFFFFF 100%)",
    },
  },
];

const BackgroundGrid = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {BackgroudArr.map((item, index) => (
          <div
            key={index}
            className="relative group border-b border-l border-dashed  aspect-video flex items-center justify-center "
          >
            <div className=" z-30 w-full h-full flex items-center justify-center overflow-hidden">
                {/* Wrap content to prevent overflow and center it, similar to the editor preview but smaller */}
                 {item.component ? (
                     <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-background/50">
                        {item.component}
                     </div>
                 ) : item.style ? (
                    <div className="w-full h-full relative overflow-hidden">
                        <div className="absolute inset-0" style={{...item.style, borderRadius: '0px'}} />
                    </div>
                ) : null}
            </div>
  
            <div className=" leading-1 absolute left-1.5  bottom-1.5 z-40">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
  
            <div className="absolute inset-x-0  top-0 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] h-full gap-2">
              <div className=" border-t border-dashed "></div>
              <Button
                size={"sm"}
                variant={"copy"}
                onClick={() => {
                   let code = "";
                   if (item.style) {
                        const props = Object.entries(item.style)
                            .map(([k, v]) => `  ${k}: "${v}",`)
                            .join("\n");
                        code = `<div style={{\n${props}\n}} className="absolute inset-0" />`;
                   } else {
                        // Fallback logic for components or generic copy
                        code = `// Use specific component for ${item.name}`;
                   }
                  navigator.clipboard.writeText(code);
                  toast.success("Code copied to clipboard!");
                }}
                className="text-xs  cursor-pointer z-30 relative border  border-dashed right-1 top-1  rounded-none "
              >
                <Copy className=" size-3" /> Copy
                <span className="absolute -right-px -top-px z-30 block size-2 border-b border-l border-dashed "></span>
                <span className="absolute -bottom-px -left-[0.5px] z-30 border-t border-r block size-2  border-dashed"></span>
              </Button>
              <div />
              <div className=" border-r border-dashed h-full -mr-[0.5px] " />
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  export default BackgroundGrid;
  
