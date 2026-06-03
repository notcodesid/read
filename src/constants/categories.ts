/** Display order for Noah Zender idea categories in the library */
export const CATEGORY_ORDER = [
  'Saved',
  'Knowledge & Learning',
  'Creativity, Craft & Writing',
  'Product & Startups',
  'Brand, Marketing & Media',
  'Innovation, Technology & AI',
  'Mental Models & Decisions',
  'Investing, Markets & Economics',
  'Work, Leadership & Relationships',
  'Psychology, Identity & Growth',
  'Philosophy & Worldviews',
] as const;

export function sortCategorySections<T extends { category: string }>(sections: T[]): T[] {
  const order = new Map(CATEGORY_ORDER.map((name, index) => [name, index]));

  return [...sections].sort((a, b) => {
    const aIndex = order.get(a.category as (typeof CATEGORY_ORDER)[number]);
    const bIndex = order.get(b.category as (typeof CATEGORY_ORDER)[number]);

    if (aIndex !== undefined && bIndex !== undefined) {
      return aIndex - bIndex;
    }
    if (aIndex !== undefined) return -1;
    if (bIndex !== undefined) return 1;
    return a.category.localeCompare(b.category);
  });
}