import bundledSummaries from '@/data/article-summaries.json';

/** Category display order per author (their own taxonomy). */
export const AUTHOR_CATEGORY_ORDER: Record<string, readonly string[]> = {
  'paul-graham': ['Essays'],
  'noah-zender': [
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
  ],
  'dan-koe': ['Letters'],
};

export function sortSectionsForAuthor<T extends { category: string }>(
  authorId: string,
  sections: T[],
): T[] {
  const order = AUTHOR_CATEGORY_ORDER[authorId];
  if (!order) {
    return [...sections].sort((a, b) => a.category.localeCompare(b.category));
  }

  const rank = new Map(order.map((name, index) => [name, index]));

  return [...sections].sort((a, b) => {
    const aIndex = rank.get(a.category);
    const bIndex = rank.get(b.category);

    if (aIndex !== undefined && bIndex !== undefined) {
      return aIndex - bIndex;
    }
    if (aIndex !== undefined) return -1;
    if (bIndex !== undefined) return 1;
    return a.category.localeCompare(b.category);
  });
}

type SummaryRow = { author_id: string; category: string | null };

/** Categories to show on the home author shelf (from bundled library). */
export function getAuthorShelfCategories(authorId: string): string[] {
  const fromArticles = new Set<string>();

  for (const row of bundledSummaries as SummaryRow[]) {
    if (row.author_id === authorId && row.category) {
      fromArticles.add(row.category);
    }
  }

  if (fromArticles.size > 0) {
    return sortSectionsForAuthor(
      authorId,
      [...fromArticles].map((category) => ({ category })),
    ).map((section) => section.category);
  }

  return [...(AUTHOR_CATEGORY_ORDER[authorId] ?? [])];
}