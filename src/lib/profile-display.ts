import type { AppleUserSession } from '@/types/apple-session';

export function profileInitials(fullName?: string): string | null {
  if (!fullName?.trim()) {
    return null;
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function profileDisplayName(session: AppleUserSession): string | null {
  return session.fullName?.trim() || null;
}

export function profileSubtitle(session: AppleUserSession): string | undefined {
  return session.email?.trim() || undefined;
}