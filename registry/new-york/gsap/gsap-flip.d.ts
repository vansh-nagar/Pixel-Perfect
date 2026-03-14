declare module "gsap/dist/Flip.js" {
  export const Flip: {
    getState: (target: Element) => unknown;
    from: (
      state: unknown,
      vars?: {
        duration?: number;
        ease?: string;
      },
    ) => unknown;
  };

  export default Flip;
}
