import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import LandoNorrisEffect from "../pixels/image/sasta-lando";
import ImageInertia from "../pixels/image/image-inertia";

const Buttons = [
  {
    name: "Lando Norris Effect",
    description: "A fluid simulation effect inspired by Lando Norris.",
    component: <LandoNorrisEffect />,
    image: "",
    link: "https://arclabs.space/",
  },
  {
    name: "Image Inertia Effect",
    description:
      "A image component that moves with inertia based on mouse movement using GSAP.",
    component: (
      <ImageInertia
        images={[
          "https://cdn.cosmos.so/3c35a1b1-717b-4219-9282-881a762724f2?format=jpeg",
          "https://cdn.cosmos.so/8a6998b4-fce7-48c4-b40c-9b90bcf0007c?format=jpeg",
          "https://cdn.cosmos.so/f798acc8-6bc8-4f2c-ace2-2440f2be4795?format=jpeg",
          "https://cdn.cosmos.so/39a80b7b-29fb-4079-a251-176df0fa15eb?format=jpeg",
          "https://cdn.cosmos.so/dfa2ba1c-97b6-44ba-a68b-7c619c9d416b?format=jpeg",
          "https://cdn.cosmos.so/97de8d7c-f9c0-4625-838f-3aaf8c286cdb?format=jpeg",
          "https://cdn.cosmos.so/71e10d8f-c92d-4761-96ce-4b6cc9eedcbe?format=jpeg",
          "https://cdn.cosmos.so/0cff1394-f353-4c9e-87f7-37c63d165bf9?format=jpeg",
          "https://cdn.cosmos.so/15a7b84c-ba74-470f-8813-25eb0a0d8ba2?format=jpeg",
          "https://cdn.cosmos.so/242c9ee5-2f96-49a6-8ac7-6058d86cf3b3?format=jpeg",
          "https://cdn.cosmos.so/0cdf2bce-81e3-47d6-b523-b1b6b06215ae?format=jpeg",
          "https://cdn.cosmos.so/b42b471c-e9ac-4b6e-a449-f7a561bab8ad?format=jpeg",
          "https://cdn.cosmos.so/55178a90-415a-4651-881b-6fbe9fb3265c?format=jpeg",
          "https://cdn.cosmos.so/0afc0da6-c103-468a-8bdb-9efbe3f5bd36?format=jpeg",
        ]}
      />
    ),
    image: "",
    link: "https://arclabs.space/",
  },
];

const ImageGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
      {Buttons.map((item, index) => (
        <div
          key={index}
          className="relative border-dashed  aspect-square flex items-center justify-center overflow-hidden "
        >
          {item.component}
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className=" aspect-square  object-cover"
            />
          )}

          <div className="absolute  inset-x-0   bottom-0 bg-background/10 backdrop-blur-sm p-1.5">
            <div className=" leading-1 ">
              <p className="text-xs ">{item.name}</p>
              <p className="text-[8px] text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>

          <Button
            size={"sm"}
            variant={"secondary"}
            className="text-xs  absolute cursor-pointer z-30  right-1 top-1 "
          >
            <Copy className=" size-3" /> Copy
          </Button>
          <div />
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;
