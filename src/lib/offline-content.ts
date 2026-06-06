import { getBundledSummaries } from '@/lib/articles';
import { getBundledAuthors } from '@/lib/authors';
import { getBundledAuthorGroups } from '@/lib/taxonomy';
import type { ArticleSummary } from '@/types/article';
import type { Author } from '@/types/author';
import type { AuthorGroup } from '@/types/taxonomy';

/** Immediate local library — no network. */
export function getOfflineAuthors(): Author[] {
  return getBundledAuthors();
}

export function getOfflineAuthorGroups(): AuthorGroup[] {
  return getBundledAuthorGroups();
}

export function getOfflineArticleSummaries(authorId?: string): ArticleSummary[] {
  return getBundledSummaries(authorId);
}

export { resolveArticleLocal } from '@/lib/articles';