export type RecentlyOpenedItem = {
  articleId: string;
  title: string;
  authorId: string;
  authorName: string;
  category?: string;
  openedAt: string;
  completed: boolean;
};