// Work-in-progress routes (playground, isometric) exist only in `next dev`.
// Production builds 404 them and hide their links.
export const DEV_ONLY_ROUTES = ["/playground", "/isometric"] as const;
export const isDev = process.env.NODE_ENV !== "production";
