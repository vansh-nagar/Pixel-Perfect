import { notFound } from "next/navigation";
import { CaptureStage } from "@/components/local-recorder/capture-stage";

export default function LocalRecorderPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <CaptureStage />;
}
