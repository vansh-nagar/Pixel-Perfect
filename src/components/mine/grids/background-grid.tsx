"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Check, Code, Paintbrush, RotateCcw } from "lucide-react";
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

type GradientItem = {
  name: string;
  description: string;
  component?: React.ReactNode;
  style?: React.CSSProperties;
  editable: boolean;
};

const initialGradients: GradientItem[] = [
  {
    name: "Gradient 1",
    description: "Radial glow fade",
    component: <Gradient1 />,
    editable: false,
  },
  {
    name: "Gradient 2",
    description: "Bottom radial bloom",
    component: <Gradient2 />,
    editable: false,
  },
  {
    name: "Gradient 3",
    description: "Diagonal micro pattern",
    component: <Gradient3 />,
    editable: false,
  },
  {
    name: "Gradient 4",
    description: "Dual grid system",
    component: <Gradient4 />,
    editable: false,
  },
  {
    name: "Gradient 5",
    description: "Dot mesh texture",
    component: <Gradient5 />,
    editable: false,
  },
  {
    name: "Gradient 6",
    description: "Purple-blue angled gradient",
    editable: true,
    style: {
      background: "linear-gradient(115.43deg, #1A00FF 0%, #9D00FF 100%)",
    },
  },
  {
    name: "Gradient 7",
    description: "Multi-layer conic sweep",
    editable: true,
    style: {
      background:
        "conic-gradient(from 135deg at 50% 50%, rgba(0, 0, 0, 0) 0deg, #000000 360deg), conic-gradient(from 44.87deg at 50% 50%, rgba(0, 0, 0, 0) 0deg, #000000 360deg), conic-gradient(from -89.88deg at 50% 50%, #FFFFFF 0deg, #999999 360deg)",
    },
  },
  {
    name: "Gradient 8",
    description: "Sunset glow with inner shadow",
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
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
    editable: true,
    style: {
      background:
        "linear-gradient(99.09deg, rgba(211, 212, 213, 0.18) 12.86%, rgba(139, 145, 147, 0.18) 15.34%, rgba(87, 95, 99, 0.18) 17.82%, rgba(55, 65, 69, 0.18) 18.64%, rgba(43, 54, 58, 0.18) 19.47%, rgba(52, 62, 66, 0.18) 22.77%, rgba(77, 85, 89, 0.18) 26.9%, rgba(117, 123, 126, 0.18) 32.68%, rgba(173, 176, 177, 0.18) 38.46%, rgba(205, 205, 206, 0.18) 41.76%, rgba(198, 199, 200, 0.18) 43.41%, rgba(180, 182, 184, 0.18) 45.06%, rgba(151, 156, 158, 0.18) 46.71%, rgba(111, 118, 122, 0.18) 49.19%, rgba(72, 83, 87, 0.18) 50.84%, rgba(76, 86, 90, 0.18) 52.49%, rgba(89, 98, 102, 0.18) 54.97%, rgba(112, 117, 120, 0.18) 57.45%, rgba(143, 144, 146, 0.18) 59.1%, rgba(152, 152, 154, 0.18) 59.92%, rgba(165, 165, 166, 0.18) 63.23%, rgba(199, 199, 200, 0.18) 70.66%, rgba(255, 255, 255, 0.18) 78.91%, rgba(209, 209, 210, 0.18) 81.39%, rgba(79, 79, 83, 0.18) 87.17%, rgba(27, 27, 32, 0.18) 90.47%, rgba(49, 49, 54, 0.18) 91.3%, rgba(77, 77, 81, 0.18) 92.12%, rgba(116, 116, 118, 0.18) 92.95%, rgba(165, 165, 167, 0.18) 94.6%, rgba(233, 233, 233, 0.18) 95.43%), linear-gradient(273.67deg, #E8E8E8 19.03%, #F9F9F9 80.97%)",
      backgroundBlendMode: "hard-light, normal",
      borderRadius: "16px",
    },
  },
  {
    name: "Gradient 17",
    description: "White glassmorphism",
    editable: true,
    style: {
      background:
        "linear-gradient(137.47deg, rgba(255, 255, 255, 0.3) 11.08%, rgba(248, 250, 255, 0.8) 39.07%, rgba(245, 248, 255, 0.9) 60.7%, rgba(255, 255, 255, 0.2) 95.9%)",
      boxShadow:
        "9.25px 13.75px 2px rgba(255, 223, 220, 0.13), inset -1px -3.25px 9.075px #FFFFFF, inset 0.75px 3px 7.7px rgba(255, 213, 209, 0.43)",
      backdropFilter: "blur(0.5px)",
      borderRadius: "11.75px",
    },
  },
];

export const BackgroudArr = initialGradients;

const extractColors = (cssString: string) => {
  if (!cssString) return [];
  const regex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g;
  const matches = Array.from(cssString.matchAll(regex));
  return matches.map(m => ({
    color: m[0],
    index: m.index!,
    length: m[0].length
  }));
};

export default function BackgroundGrid() {
  const [gradients, setGradients] = useState<GradientItem[]>(initialGradients);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>({});
  
  useEffect(() => {
    const item = gradients[selectedIdx] || gradients[0];
    if (item?.style) {
      setCurrentStyle({ ...item.style });
    } else {
      setCurrentStyle({});
    }
  }, [selectedIdx, gradients]);

  const selectedItem = gradients[selectedIdx] || gradients[0];

  const handleStyleChange = (key: keyof React.CSSProperties, value: string) => {
    const newStyle = { ...currentStyle, [key]: value };
    setCurrentStyle(newStyle);
    
    const newGradients = [...gradients];
    if (newGradients[selectedIdx]) {
        newGradients[selectedIdx] = {
            ...newGradients[selectedIdx],
            style: newStyle
        };
        setGradients(newGradients);
    }
  };

  // Helper to convert hex to rgb
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
  };

  const handleColorReplace = (index: number, length: number, newColorHex: string) => {
    if (!currentStyle.background) return;
    const currentBg = currentStyle.background as string;
    const oldColorString = currentBg.substring(index, index + length);
    
    let replacement = newColorHex;

    // Try to preserve alpha if original was rgba
    if (oldColorString.toLowerCase().startsWith("rgba")) {
        // Extract alpha: last number before closing parenthesis
        const alphaMatch = oldColorString.match(/,\s*([\d\.]+|[\d\.]+%)\s*\)/);
        if (alphaMatch && alphaMatch[1]) {
            const alpha = alphaMatch[1];
            const rgb = hexToRgb(newColorHex);
            if (rgb) {
                replacement = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            }
        }
    }

    const newBackground = currentBg.substring(0, index) + replacement + currentBg.substring(index + length);
    handleStyleChange("background", newBackground);
  };

  const copyToClipboard = () => {
     let code = "";
     if (selectedItem.editable && selectedItem.style) {
         const props = Object.entries(currentStyle)
             .map(([k, v]) => `  ${k}: "${v}",`)
             .join("\n");
         code = `<div style={{\n${props}\n}} className="absolute inset-0" />`;
     } else {
         code = `// Use specific component for ${selectedItem.name}`;
     }
     navigator.clipboard.writeText(code);
     toast.success("Code copied to clipboard!");
  };

  return (
    <div className="flex h-[800px] w-full rounded-xl border bg-background overflow-hidden shadow-sm">
      <div className="w-80 border-r bg-muted/10 flex flex-col h-full">
        <div className="p-4 border-b shrink-0 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Backgrounds</h2>
            <p className="text-xs text-muted-foreground">Select to edit</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {gradients.map((item, index) => (
            <button
              key={index}
              onClick={() => setSelectedIdx(index)}
               className={`w-full text-left group flex flex-col gap-2 p-2 rounded-lg border transition-all hover:border-primary/50 relative overflow-hidden ${
                selectedIdx === index ? "ring-2 ring-primary border-primary" : "border-border"
              }`}
            >
              <div className="w-full h-24 rounded-md overflow-hidden relative shadow-sm">
                {item.style ? (
                  <div className="absolute inset-0" style={item.style} />
                ) : (
                  item.component
                )}
              </div>
              <div>
                <span className="font-medium text-sm block">{item.name}</span>
                <span className="text-xs text-muted-foreground truncate block">
                  {item.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2">
                <span className="font-medium">{selectedItem.name}</span>
                {selectedItem.editable && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">Editable</span>}
            </div>
            <div className="flex items-center gap-2">
                 <Button size="sm" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" /> Copy JSX
                 </Button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
             <div className="flex-1 bg-muted/20 p-8 flex items-center justify-center relative overflow-hidden">
                 <div className="w-full h-full max-w-4xl max-h-[600px] relative shadow-2xl rounded-xl overflow-hidden border bg-white dark:bg-black transition-all duration-300">
                     {selectedItem.editable ? (
                        <div className="absolute inset-0" style={currentStyle} />
                     ) : (
                        selectedItem.component
                     )}
                 </div>
                 <div className="absolute bottom-6 left-6 text-xs text-muted-foreground">
                    Preview Mode
                 </div>
             </div>

             {selectedItem.editable && (
                 <div className="w-80 border-l bg-background flex flex-col overflow-y-auto">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Paintbrush className="w-4 h-4" /> Edit Colors
                        </h3>
                    </div>
                    
                    <div className="p-4 space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Palette detected</label>
                            <div className="grid grid-cols-5 gap-2">
                                {extractColors(currentStyle.background as string || "").map((item, i) => (
                                    <div key={i} className="group relative" title={item.color}>
                                        <div 
                                            className="w-10 h-10 rounded-full border shadow-sm cursor-pointer overflow-hidden relative"
                                            style={{ background: item.color }}
                                        >
                                            <input 
                                                type="color" 
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                                onChange={(e) => handleColorReplace(item.index, item.length, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {extractColors(currentStyle.background as string || "").length === 0 && <span className="text-xs text-muted-foreground col-span-5">No editable colors found</span>}
                            </div>
                        </div>

                        <div className="space-y-3">
                             <div className="flex items-center justify-between">
                                 <label className="text-sm font-medium flex items-center gap-2">
                                     <Code className="w-4 h-4" /> CSS Properties
                                 </label>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => setCurrentStyle(selectedItem.style || {})}
                                    title="Reset"
                                 >
                                    <RotateCcw className="w-3 h-3" />
                                 </Button>
                             </div>
                             <textarea 
                                className="w-full h-64 p-3 text-xs font-mono bg-muted/50 rounded-md border resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                value={currentStyle.background as string}
                                onChange={(e) => handleStyleChange("background", e.target.value)}
                                placeholder="background: ..."
                             />
                             <div className="text-[10px] text-muted-foreground">
                                 Edit the standard CSS string above to see changes.
                             </div>
                        </div>
                    </div>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
}
