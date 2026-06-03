/** Bundled hero images for offline reading (keyed by article id). */
export const BUNDLED_HERO_IMAGES: Partial<Record<string, number>> = {
  'the-path-at-night': require('@/assets/images/articles/the-path-at-night.jpg'),
};

export function getBundledHeroImageSource(articleId: string): number | undefined {
  return BUNDLED_HERO_IMAGES[articleId];
}