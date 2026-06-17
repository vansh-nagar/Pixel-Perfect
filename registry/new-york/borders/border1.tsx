const Border1 = () => (
  <div className="relative w-full h-full">
    <span className="absolute -top-0 -left-[0.5px] block size-6 border-dashed border-t-1 border-l-1 border-muted-foreground z-30" />
    <span className="absolute -top-px -right-px block size-6 border-dashed border-t-1 border-r-1 border-muted-foreground z-30" />
    <span className="absolute -bottom-px -left-[0.5px] block size-6 border-dashed border-b-1 border-l-1 border-muted-foreground z-30" />
    <span className="absolute -bottom-px -right-px block size-6 border-b-1 border-r-1 border-dashed border-muted-foreground z-30" />
  </div>
);

export default Border1;
