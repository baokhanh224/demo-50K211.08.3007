import { productCategoryNames } from "./product-validation";

// One catalog for products, supplier selection and reports. Keep the familiar
// default order, include supplier-created categories, and put Other last.
export function sortCategories<T extends { id: number; name: string }>(categories: T[]): T[] {
  const rank = (name: string) => {
    if (name === "Khác") return Number.MAX_SAFE_INTEGER;
    const index = productCategoryNames.indexOf(name);
    return index < 0 ? productCategoryNames.length - 1 : index;
  };
  return [...categories].sort((a, b) => rank(a.name) - rank(b.name)
    || a.name.localeCompare(b.name, "vi") || a.id - b.id);
}
