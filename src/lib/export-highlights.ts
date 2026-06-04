import type { Highlight } from '@/types/highlight';

const LABEL_NAMES: Record<string, string> = {
  idea: 'Idea',
  quote: 'Quote',
  todo: 'Todo',
};

export function highlightsToMarkdown(
  articleTitle: string,
  highlights: Highlight[],
  authorName?: string,
): string {
  const sorted = [...highlights].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const lines = [`# Highlights — ${articleTitle}`];

  if (authorName) {
    lines.push(`*${authorName}*`, '');
  }

  if (sorted.length === 0) {
    lines.push('', '_No highlights yet._');
    return lines.join('\n');
  }

  for (const item of sorted) {
    const tags: string[] = [];
    if (item.label) {
      tags.push(LABEL_NAMES[item.label] ?? item.label);
    }
    if (item.color) {
      tags.push(item.color);
    }

    const tagSuffix = tags.length > 0 ? ` (${tags.join(', ')})` : '';
    lines.push('', `> ${item.quote.replace(/\n/g, '\n> ')}${tagSuffix}`);

    if (item.note?.trim()) {
      lines.push('', `Note: ${item.note.trim()}`);
    }
  }

  lines.push('', `---`, `Exported from Read · ${sorted.length} highlight${sorted.length === 1 ? '' : 's'}`);
  return lines.join('\n');
}