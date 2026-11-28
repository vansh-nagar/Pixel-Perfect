export const BorderDecorator = ({
  notch = false,
  spinOnHover = false,
  guides = true,
}: {
  notch?: boolean;
  spinOnHover?: boolean;
  /** The centre circle and crosshair lines behind the component. */
  guides?: boolean;
}) => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-[0.5px] top-0 block size-6 border-l border-t border-dashed z-40 pointer-events-none" />
      <span className="border-muted-foreground absolute -right-px -top-px block size-6 border-r border-t border-dashed z-40 pointer-events-none" />
      <span className="border-muted-foreground absolute -bottom-px -left-[0.5px] block size-6 border-b border-l border-dashed z-40 pointer-events-none" />
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-6 border-b border-r border-dashed z-40 pointer-events-none" />

      {notch && (
        <span className="pointer-events-none absolute -top-px -right-[0.5px] z-40 mt-px block size-2 border-b border-l border-dashed px-[38px] py-[20px]" />
      )}

      {guides && (
        <>
          <div
            className={`absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gray-300 dark:border-gray-700 z-10 pointer-events-none ${
              spinOnHover ? "group-hover:animate-spin" : ""
            }`}
          />
          <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-linear-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-linear-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 pointer-events-none" />
        </>
      )}
    </>
  );
};

export default BorderDecorator;
