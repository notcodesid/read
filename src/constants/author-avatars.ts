/** Bundled grayscale author portraits (see scripts/fetch-author-avatars.mjs). */
export const BUNDLED_AUTHOR_AVATARS: Partial<Record<string, number>> = {
  'noah-zender': require('@/assets/images/authors/noah-zender.png'),
  'paul-graham': require('@/assets/images/authors/paul-graham.png'),
  'dan-koe': require('@/assets/images/authors/dan-koe.png'),
  antislop: require('@/assets/images/authors/antislop.png'),
};

export function getAuthorAvatarSource(authorId: string): number | undefined {
  return BUNDLED_AUTHOR_AVATARS[authorId];
}