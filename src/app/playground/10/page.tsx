import ParticleSocialButton from "./particle-social-button";

const Page = async ({ searchParams }: { searchParams: Promise<{ loop?: string }> }) => {
  const loop = (await searchParams).loop !== undefined;
  return (
    <div className="grid min-h-screen place-items-center bg-white">
      {/* ?loop: recording mode. Shoot it close up with a small viewport and a high scale. */}
      <ParticleSocialButton variant="dark" loop={loop} />
    </div>
  );
};

export default Page;
