const AVATAR_PALETTES = [
  { background: '#5856D6', text: '#FFFFFF' },
  { background: '#007AFF', text: '#FFFFFF' },
  { background: '#34C759', text: '#FFFFFF' },
  { background: '#FF9500', text: '#FFFFFF' },
  { background: '#FF2D55', text: '#FFFFFF' },
  { background: '#AF52DE', text: '#FFFFFF' },
  { background: '#5AC8FA', text: '#FFFFFF' },
  { background: '#FF3B30', text: '#FFFFFF' },
] as const;

export function avatarColorForUser(userId: string): { background: string; text: string } {
  let hash = 0;
  for (let index = 0; index < userId.length; index++) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }

  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}