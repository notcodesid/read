export type CompletedArticle = {
  completedAt: string;
};

export type CompletedTheme = {
  completedAt: string;
};

export type ScrollPosition = {
  offsetY: number;
  updatedAt: string;
};

export type ReadingProgressStore = {
  articles: Record<string, CompletedArticle>;
  themes: Record<string, CompletedTheme>;
  scrollPositions: Record<string, ScrollPosition>;
};

export type ThemeProgress = {
  themeKey: string;
  completed: number;
  total: number;
  isComplete: boolean;
};