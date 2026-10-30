import ShelfGallery from "./shelf-gallery";

const Page = async ({ searchParams }: { searchParams: Promise<{ loop?: string }> }) => {
  const loop = (await searchParams).loop !== undefined;
  return (
    <div className="h-dvh w-full">
      <ShelfGallery loop={loop} />
    </div>
  );
};

export default Page;
