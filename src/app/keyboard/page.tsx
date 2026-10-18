import { ComputerScene } from "./computer-scene";
import { KeyboardScene } from "./keyboard-scene";
import { MacropadScene } from "./macropad-scene";
import { RegisterScene } from "./register-scene";
import { TowerScene } from "./tower-scene";

const Page = () => {
  return (
    <main className="overflow-x-clip bg-[#0b0c0d]">
      <KeyboardScene />
      <MacropadScene />
      <RegisterScene />
      <ComputerScene />
      <TowerScene />
    </main>
  );
};

export default Page;
