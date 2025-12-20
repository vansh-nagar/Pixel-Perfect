import { Button } from "@/components/ui/button";

const Buttons = [
  {
    name: "Buttons",
    description:
      "Enim et enim nulla duis elit esse ex dolor sunt sit veniam proident. ",
    component: <Button>press me</Button>,
  },
  {
    name: "Buttons",
    description:
      "Enim et enim nulla duis elit esse ex dolor sunt sit veniam proident. ",
    component: <Button>press me</Button>,
  },
];

const ButtonGrid = () => {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Buttons.map((item, index) => (
        <div
          key={index}
          className="relative border border-dashed  aspect-square flex items-center justify-center "
        >
          <BorderDecorator />
          <div className=" z-30">{item.component}</div>

          <div className=" leading-1 absolute left-1.5  bottom-1.5">
            <p className="text-xs ">{item.name}</p>
            <p className="text-[8px] text-muted-foreground">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ButtonGrid;

const BorderDecorator = () => {
  return (
    <>
      <span className="border-muted-foreground absolute -left-px -top-px block size-2 border-l-2 border-t-2 z-30"></span>
      <span className="border-muted-foreground absolute -right-px -top-px block size-2 border-r-2 border-t-2 z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 z-30"></span>
      <span className="border-muted-foreground absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 z-30"></span>

      {/* Circular border */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-dashed border-gray-300 dark:border-gray-700 rounded-full z-10 pointer-events-none"></div>

      {/* Horizontal line */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-y-1/2 z-10 pointer-events-none"></div>

      {/* Vertical line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent -translate-x-1/2 z-10 pointer-events-none"></div>
    </>
  );
};
