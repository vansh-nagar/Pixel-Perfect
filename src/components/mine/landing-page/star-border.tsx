import { cn } from "@/lib/utils";

const StarBorder = () => {
  return (
    <>
      <Star className="absolute -top-[7.9px] -right-[7.6px] z-50" />
      <Star className="absolute -bottom-[8px] -right-[7.8px] z-50" />
      <Star className="absolute -top-[7.9px] -left-[7.8px] z-50" />
      <Star className="absolute -bottom-[8px] -left-[7.8px] z-50" />
    </>
  );
};

export default StarBorder;

const Star = ({ className }: { className?: string }) => {
  return (
    <div className={cn("w-4 h-4 text-muted ", className)}>
      <svg viewBox="0 0 30 30" className="w-full h-full ">
        <path
          fill="currentColor"
          d="
          M15 0
          C19 9 21 11 30 15
          C21 19 19 21 15 30
          C11 21 9 19 0 15
          C9 11 11 9 15 0
          Z
          "
        />
      </svg>
    </div>
  );
};
