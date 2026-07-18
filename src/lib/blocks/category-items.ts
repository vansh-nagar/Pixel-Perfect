// Server-only resolver for category component lists. Bundles registry.json —
// never import this from a "use client" file; use categories.ts there instead.

import registry from "../../../registry.json";
import { SHADERS } from "@/components/pixel-perfect/shaders/registry";
import { IMAGE_SHADERS } from "@/components/pixel-perfect/shaders/image-registry";
import { getCategory, type CategoryItem } from "./categories";

type RegistryItem = {
  name: string;
  description?: string;
  files?: { path: string }[];
};

const titleize = (kebab: string) =>
  kebab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const registryFolder = (item: RegistryItem) =>
  item.files?.[0]?.path.split("/")[2];

export function getCategoryItems(slug: string): CategoryItem[] {
  const category = getCategory(slug);
  if (!category) return [];
  const { source } = category;

  switch (source.type) {
    case "registry":
      return (registry.items as RegistryItem[])
        .filter((item) => {
          if (registryFolder(item) !== source.folder) return false;
          if (source.nameEndsWith && !item.name.endsWith(source.nameEndsWith))
            return false;
          if (
            source.nameNotEndsWith &&
            item.name.endsWith(source.nameNotEndsWith)
          )
            return false;
          if (source.exclude?.includes(item.name)) return false;
          return true;
        })
        .map((item) => ({
          name: titleize(item.name),
          description: item.description ?? "",
        }));
    case "shader-data": {
      const shaders = source.set === "shaders" ? SHADERS : IMAGE_SHADERS;
      return shaders.map((shader) => ({
        name: shader.title,
        description: shader.description,
      }));
    }
    case "manual":
      return source.items;
  }
}
