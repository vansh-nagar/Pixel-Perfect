// @ts-nocheck
import * as __fd_glob_16 from "../content/docs/installation/getting-started.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/blocks/text-inertia.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/blocks/text-fade.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/blocks/shader1.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/blocks/sasta-lando.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/blocks/ring.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/blocks/mouse-follower.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/blocks/mouse-follower-3.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/blocks/mouse-follower-2.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/blocks/infinite-image-scroller.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/blocks/infinite-image-scroller-plane.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/blocks/image-inertia.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/blocks/cards-stack.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/blocks/camera.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/installation/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content\docs", {"meta.json": __fd_glob_0, "installation/meta.json": __fd_glob_1, }, {"index.mdx": __fd_glob_2, "blocks/camera.mdx": __fd_glob_3, "blocks/cards-stack.mdx": __fd_glob_4, "blocks/image-inertia.mdx": __fd_glob_5, "blocks/infinite-image-scroller-plane.mdx": __fd_glob_6, "blocks/infinite-image-scroller.mdx": __fd_glob_7, "blocks/mouse-follower-2.mdx": __fd_glob_8, "blocks/mouse-follower-3.mdx": __fd_glob_9, "blocks/mouse-follower.mdx": __fd_glob_10, "blocks/ring.mdx": __fd_glob_11, "blocks/sasta-lando.mdx": __fd_glob_12, "blocks/shader1.mdx": __fd_glob_13, "blocks/text-fade.mdx": __fd_glob_14, "blocks/text-inertia.mdx": __fd_glob_15, "installation/getting-started.mdx": __fd_glob_16, });