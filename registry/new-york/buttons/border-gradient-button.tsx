import { Button } from "@/components/ui/button";

const BorderGradientButton = () => {
  return (
    <Button className="relative rounded-md animate-rainbow bg-[linear-gradient(45deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-[length:200%] active:scale-[0.95]  group">
      <div className="z-0 absolute inset-[1.5px] bg-background/95 group-hover:bg-background/40  backdrop-blur-3xl rounded-sm transition-all saturate-200" />
      <span className="z-10 text-foreground pointer-events-none">
        Gradient Border
      </span>
    </Button>
  );
};

export default BorderGradientButton;
