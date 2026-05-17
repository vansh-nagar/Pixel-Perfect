import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BorderGradientButtonProps {
  colors?: [string, string, string, string, string];
  className?: string;
  children?: React.ReactNode;
}

const defaultColors: [string, string, string, string, string] = [
  "var(--color-1)",
  "var(--color-5)",
  "var(--color-3)",
  "var(--color-4)",
  "var(--color-2)",
];

const BorderGradientButton = ({
  colors = defaultColors,
  className,
  children,
}: BorderGradientButtonProps) => {
  return (
    <Button
      className={cn(
        "relative rounded-md animate-rainbow bg-[length:200%] active:scale-[0.95] group",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(45deg, ${colors.join(",")})`,
      }}
    >
      <div className="z-0 absolute inset-[1.5px] bg-background/95 group-hover:bg-background/40 backdrop-blur-3xl rounded-sm transition-all saturate-200" />
      <span className="z-10 text-foreground pointer-events-none">
        {children ?? "Gradient Border"}
      </span>
    </Button>
  );
};

export default BorderGradientButton;
