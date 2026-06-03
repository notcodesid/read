export type AuthorGroup = {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
};

export type BlogTopic = {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  articleCount: number;
};

export type HomeBrowseMode = 'authors' | 'blogs';

import type { Author } from '@/types/author';

export type AuthorGroupSection = {
  group: AuthorGroup;
  authors: Author[];
};

export type BlogTopicSection = {
  topic: BlogTopic;
  previewTitles: string[];
};