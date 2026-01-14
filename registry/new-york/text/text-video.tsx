const TextVideo = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="text-7xl font-extrabold bg-clip-text text-transparent"
      style={{
        backgroundImage: `url('https://i.pinimg.com/originals/80/b7/5e/80b75eb774b647c67b2efa531b57ba13.gif')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {children}
    </div>
  );
};

export default TextVideo;
