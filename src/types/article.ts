export type ArticleSummary = {
  id: string;
  title: string;
  category?: string;
};

export type Article = ArticleSummary & {
  source?: string;
  author?: string;
  sourceUrl?: string;
  paragraphs: string[];
  addedAt: string;
};

export type ArticleSection = {
  category: string;
  articles: ArticleSummary[];
};