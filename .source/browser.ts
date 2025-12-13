// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "blocks/camera.mdx": () => import("../content/docs/blocks/camera.mdx?collection=docs"), "blocks/cards-stack.mdx": () => import("../content/docs/blocks/cards-stack.mdx?collection=docs"), "blocks/image-inertia.mdx": () => import("../content/docs/blocks/image-inertia.mdx?collection=docs"), "blocks/infinite-image-scroller-plane.mdx": () => import("../content/docs/blocks/infinite-image-scroller-plane.mdx?collection=docs"), "blocks/infinite-image-scroller.mdx": () => import("../content/docs/blocks/infinite-image-scroller.mdx?collection=docs"), "blocks/mouse-follower-2.mdx": () => import("../content/docs/blocks/mouse-follower-2.mdx?collection=docs"), "blocks/mouse-follower-3.mdx": () => import("../content/docs/blocks/mouse-follower-3.mdx?collection=docs"), "blocks/mouse-follower.mdx": () => import("../content/docs/blocks/mouse-follower.mdx?collection=docs"), "blocks/ring.mdx": () => import("../content/docs/blocks/ring.mdx?collection=docs"), "blocks/sasta-lando.mdx": () => import("../content/docs/blocks/sasta-lando.mdx?collection=docs"), "blocks/shader1.mdx": () => import("../content/docs/blocks/shader1.mdx?collection=docs"), "blocks/text-fade.mdx": () => import("../content/docs/blocks/text-fade.mdx?collection=docs"), "blocks/text-inertia.mdx": () => import("../content/docs/blocks/text-inertia.mdx?collection=docs"), "installation/getting-started.mdx": () => import("../content/docs/installation/getting-started.mdx?collection=docs"), }),
};
export default browserCollections;