const Border2 = () => (
  <div className="relative w-full h-full">
    {/* Top left corner */}
    <span className="absolute -top-0 -left-[0.5px] block size-6 border-t-1 border-l-1 border-muted-foreground z-30" />
    {/* Top right corner */}
    <span className="absolute -top-px -right-px block size-6 border-t-1 border-r-1 border-muted-foreground z-30" />
    {/* Bottom left corner */}
    <span className="absolute -bottom-px -left-[0.5px] block size-6 border-b-1 border-l-1 border-muted-foreground z-30" />
    {/* Bottom right corner */}
    <span className="absolute -bottom-px -right-px block size-6 border-b-1 border-r-1 border-muted-foreground z-30" />
  </div>
);

export default Border2;
