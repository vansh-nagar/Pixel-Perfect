
import { generatePageMetadata } from "@/lib/seo/metadata";

export const metadata = generatePageMetadata({
  title: "Donate",
  description:
    "Support Pixel Perfect UI — a free, open-source React component library. Donations keep new animated components, shaders and tutorials coming.",
  path: "/donate",
});

export default function DonatePage() {
    return (
        <div>
            <h1>Donate</h1>
        </div>
    );
}