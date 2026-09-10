import { DesignEngineerCard } from "@/components/pixel-perfect/design-engineer/design-engineer-card";

import { LocalRecorder } from "@/components/local-recorder/recorder";

const Page = () => {
  return (
    <main className="pt-16">
      <DesignEngineerCard />
      {process.env.NODE_ENV === "development" && <LocalRecorder />}
    </main>
  );
};

export default Page;
