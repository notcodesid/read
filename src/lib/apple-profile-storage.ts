import * as SecureStore from 'expo-secure-store';

import { getProfilePhotoUri } from '@/lib/profile-photo';
import type { AppleUserSession } from '@/types/apple-session';

export type StoredAppleProfile = {
  user: string;
  email?: string;
  fullName?: string;
  photoUri?: string;
  photoUpdatedAt?: number;
  updatedAt: number;
};

function profileKey(userId: string): string {
  return `readAppleProfile${userId}`;
}

export async function loadStoredAppleProfile(userId: string): Promise<StoredAppleProfile | null> {
  try {
    const raw = await SecureStore.getItemAsync(profileKey(userId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredAppleProfile;
    if (parsed.user !== userId) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function saveStoredAppleProfile(profile: StoredAppleProfile): Promise<void> {
  await SecureStore.setItemAsync(profileKey(profile.user), JSON.stringify(profile));
}

export function mergeAppleProfileFields(
  userId: string,
  ...sources: Array<Pick<AppleUserSession, 'email' | 'fullName'> | null | undefined>
): Pick<AppleUserSession, 'email' | 'fullName'> {
  let email: string | undefined;
  let fullName: string | undefined;

  for (const source of sources) {
    if (!source) {
      continue;
    }
    if (!email && source.email?.trim()) {
      email = source.email.trim();
    }
    if (!fullName && source.fullName?.trim()) {
      fullName = source.fullName.trim();
    }
  }

  return { email, fullName };
}

export async function persistAppleProfileFields(
  userId: string,
  fields: Partial<Pick<StoredAppleProfile, 'email' | 'fullName' | 'photoUri' | 'photoUpdatedAt'>>,
): Promise<StoredAppleProfile> {
  const existing = await loadStoredAppleProfile(userId);
  const merged = mergeAppleProfileFields(userId, existing, fields);
  const next: StoredAppleProfile = {
    user: userId,
    email: merged.email,
    fullName: merged.fullName,
    photoUri: fields.photoUri ?? existing?.photoUri,
    photoUpdatedAt: fields.photoUpdatedAt ?? existing?.photoUpdatedAt,
    updatedAt: Date.now(),
  };

  await saveStoredAppleProfile(next);
  return next;
}

export async function enrichAppleSession(session: AppleUserSession): Promise<AppleUserSession> {
  const stored = await loadStoredAppleProfile(session.user);
  const merged = mergeAppleProfileFields(session.user, session, stored);
  const photoUri =
    getProfilePhotoUri(session.user) ?? stored?.photoUri ?? session.photoUri;

  return {
    ...session,
    email: merged.email,
    fullName: merged.fullName,
    photoUri,
    photoUpdatedAt: stored?.photoUpdatedAt ?? session.photoUpdatedAt,
  };
}