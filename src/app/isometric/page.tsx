import { ComputerScene } from "./computer-scene";
import { IsometricCarousel } from "./isometric-carousel";
import { KeyboardScene } from "./keyboard-scene";
import { MacropadScene } from "./macropad-scene";
import { RegisterScene } from "./register-scene";
import { TowerScene } from "./tower-scene";

const Page = () => {
  return (
    <main className="overflow-x-clip bg-[#0b0c0d]">
      <IsometricCarousel
        slides={[
          { title: "Keyboard", node: <KeyboardScene /> },
          { title: "Macropad", node: <MacropadScene /> },
          { title: "Register", node: <RegisterScene /> },
          { title: "Computer", node: <ComputerScene /> },
          { title: "Tower", node: <TowerScene /> },
        ]}
      />
    </main>
  );
};

export default Page;
