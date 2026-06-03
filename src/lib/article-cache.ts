import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Article, ArticleSummary } from '@/types/article';

const CACHE_KEY = 'read:article-summaries:v1';
const ARTICLE_PREFIX = 'read:article:';

export async function saveArticleSummariesCache(articles: ArticleSummary[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(articles));
}

export async function loadArticleSummariesCache(): Promise<ArticleSummary[] | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ArticleSummary[];
  } catch {
    return null;
  }
}

export async function saveArticleCache(article: Article): Promise<void> {
  await AsyncStorage.setItem(`${ARTICLE_PREFIX}${article.id}`, JSON.stringify(article));
}

export async function loadArticleCache(id: string): Promise<Article | null> {
  const raw = await AsyncStorage.getItem(`${ARTICLE_PREFIX}${id}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Article;
  } catch {
    return null;
  }
}