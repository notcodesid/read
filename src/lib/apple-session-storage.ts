import * as SecureStore from 'expo-secure-store';

import type { AppleUserSession } from '@/types/apple-session';

const SESSION_KEY = 'readAppleSession';

export async function loadAppleSession(): Promise<AppleUserSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AppleUserSession;
    if (typeof parsed.user !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveAppleSession(session: AppleUserSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearAppleSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}