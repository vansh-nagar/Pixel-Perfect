import DriftSpiral from "../drift-spiral";

const Page = async ({ searchParams }: { searchParams: Promise<{ loop?: string }> }) => {
  const loop = (await searchParams).loop !== undefined;
  return (
    <div className="h-dvh w-full">
      <DriftSpiral loop={loop} />
    </div>
  );
};

export default Page;
