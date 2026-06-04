export type BookmarkEntry = {
  savedAt: string;
};

export type BookmarkStore = {
  bookmarks: Record<string, BookmarkEntry>;
};

export type ReadLaterItem = {
  articleId: string;
  title: string;
  authorId: string;
  authorName: string;
  category?: string;
  savedAt: string;
  completed: boolean;
};