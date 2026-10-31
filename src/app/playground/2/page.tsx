import PixelEmblem from "./pixel-emblem";

const Page = async ({ searchParams }: { searchParams: Promise<{ loop?: string }> }) => {
  const loop = (await searchParams).loop !== undefined;
  return (
    <div className="relative h-dvh w-full">
      <PixelEmblem loop={loop} />
    </div>
  );
};

export default Page;
