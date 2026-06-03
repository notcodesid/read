export type ArticleSummary = {
  id: string;
  title: string;
  authorId: string;
  category?: string;
};

export type Article = ArticleSummary & {
  source?: string;
  author?: string;
  sourceUrl?: string;
  heroImageUrl?: string;
  paragraphs: string[];
  addedAt: string;
};

export type ArticleSection = {
  category: string;
  articles: ArticleSummary[];
};