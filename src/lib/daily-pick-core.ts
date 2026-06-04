export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickDailyArticleId(
  candidateIds: string[],
  dateKey: string,
  excludedIds: Set<string>,
  preferredIds: string[] = [],
): string | undefined {
  const pool = candidateIds.filter((id) => !excludedIds.has(id));
  if (pool.length === 0) {
    return undefined;
  }

  const preferred = preferredIds.filter((id) => pool.includes(id));
  if (preferred.length > 0) {
    return preferred[hashString(dateKey) % preferred.length];
  }

  const sorted = [...pool].sort((a, b) => a.localeCompare(b));
  return sorted[hashString(dateKey) % sorted.length];
}