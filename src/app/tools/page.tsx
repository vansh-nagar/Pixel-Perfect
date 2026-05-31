import Link from "next/link";

const TOOLS = [
  {
    href: "/tools/pixel-grid",
    title: "Pixel Grid",
    description:
      "A faithful recreation of the Framer PixelGrid-3 component. 24 animation presets, 12 colors, optional bloom.",
  },
  {
    href: "/tools/dot-spinner",
    title: "Dot Spinner Matrix",
    description:
      "A grid of dots with a traveling spinner. Dozens of variants covering perimeter orbits, concentric rings, radial sweeps, spirals, scanlines, matrix rain, and more.",
  },
] as const;

const Page = () => {
  return (
    <div className="min-h-screen w-full bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">Tools</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Interactive sandboxes for experimenting with components.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-neutral-950 p-6 transition-colors hover:border-white/15"
            >
              <h2 className="text-lg font-medium tracking-tight">
                {tool.title}
              </h2>
              <p className="text-sm text-neutral-400">{tool.description}</p>
              <span className="mt-auto pt-2 text-xs text-neutral-500 transition-colors group-hover:text-neutral-300">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
