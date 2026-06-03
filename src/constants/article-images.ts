/** Bundled hero images for offline reading (keyed by article id). */
export const BUNDLED_HERO_IMAGES: Partial<Record<string, number>> = {
  'how-to-become-so-creative-it-feels-illegal': require('@/assets/images/articles/how-to-become-so-creative-it-feels-illegal.jpg'),
};

export function getBundledHeroImageSource(articleId: string): number | undefined {
  return BUNDLED_HERO_IMAGES[articleId];
}