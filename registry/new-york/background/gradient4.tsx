const Gradient4 = () => {
  return (
    <div className="h-full w-full relative">
      {/* Light mode grid - dark lines */}
      <div
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05) 2px, transparent 2px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 2px, transparent 2px), linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px)`,
          backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
          backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
        }}
        className="absolute inset-0 dark:hidden"
      ></div>

      {/* Dark mode grid - white lines */}
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
};

export default Gradient4;
