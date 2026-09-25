import { Circle } from "lucide-react";
import StarBorder from "./star-border";

/**
 * The window-chrome bar that titles each landing-page section: three dots on
 * the left, the section label centred, and the corner stars.
 */
export const SectionChrome = ({
  label,
  bordered = true,
  className = "",
}: {
  label: string;
  /** Draws the divider under the bar. Off for sections that own their own. */
  bordered?: boolean;
  className?: string;
}) => {
  return (
    <div
      className={`relative flex justify-between overflow-hidden px-6 py-3 max-sm:px-3 ${
        bordered ? "border-b border-muted" : ""
      } ${className}`}
    >
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <Circle key={i} strokeWidth={1} size={15} className="text-muted-foreground/30" />
        ))}
      </div>
      <div className="text-xs tracking-wider text-muted-foreground">{label}</div>
      <StarBorder />
    </div>
  );
};

export default SectionChrome;
