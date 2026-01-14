const TextGradient = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-2xl bg-[linear-gradient(45deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] bg-clip-text text-transparent animate-rainbow bg-[length:200%]">
      {children}
    </div>
  );
};

export default TextGradient;
