const Intersection1 = () => (
  <div className="relative w-full h-full">
    {/* Circle */}
    <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none" />
    {/* Horizontal line */}
    <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 pointer-events-none" />
    {/* Vertical line */}
    <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent z-10 pointer-events-none" />
  </div>
);

export default Intersection1;
