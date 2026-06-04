/** Stable key for an author’s category section (reading theme). */
export function buildThemeKey(authorId: string, category: string): string {
  return `${authorId}:${category}`;
}

export function parseThemeKey(themeKey: string): { authorId: string; category: string } | null {
  const index = themeKey.indexOf(':');
  if (index <= 0 || index === themeKey.length - 1) {
    return null;
  }

  return {
    authorId: themeKey.slice(0, index),
    category: themeKey.slice(index + 1),
  };
}