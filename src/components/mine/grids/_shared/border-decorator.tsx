/**
 * The dashed corner brackets, crosshair rules and circle that frame a grid
 * card. Previously copy-pasted into five grids, which had drifted apart:
 * two kept Tailwind v3 `bg-gradient-*` names and only the button grid spun the
 * circle on hover.
 */
export const BorderDecorator = ({
  /** `notch` adds the small bracket in the top-right corner (svg + button grids). */
  notch = false,
  /** Spins the centre circle while the card is hovered. Needs `group` on the card. */
  spinOnHover = false,
}: {
  notch?: boolean;
  spinOnHover?: boolean;
}) => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-[0.5px] top-0 block size-6 border-l border-t border-dashed z-30" />
      <span className="border-muted-foreground absolute -right-px -top-px block size-6 border-r border-t border-dashed z-30" />
      <span className="border-muted-foreground absolute -bottom-px -left-[0.5px] block size-6 border-b border-l border-dashed z-30" />
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-6 border-b border-r border-dashed z-30" />

      {notch && (
        <span className="absolute -top-px -right-[0.5px] z-30 mt-px block size-2 border-b border-l border-dashed px-[38px] py-[20px]" />
      )}

      <div
        className={`absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gray-300 dark:border-gray-700 z-10 pointer-events-none ${
          spinOnHover ? "group-hover:animate-spin" : ""
        }`}
      />
      <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-linear-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 pointer-events-none" />
    </>
  );
};

export default BorderDecorator;
