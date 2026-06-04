export type RecommendationReason = 'theme' | 'author' | 'category' | 'discover';

export type ForYouItem = {
  articleId: string;
  title: string;
  authorId: string;
  authorName: string;
  category?: string;
  reason: RecommendationReason;
  reasonLabel: string;
};