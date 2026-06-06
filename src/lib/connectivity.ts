import * as Network from 'expo-network';

import { getSupabaseConfig, probeCatalogEndpoint } from '@/lib/supabase';

let syncBackoffUntil = 0;
const SYNC_BACKOFF_MS = 60_000;

export function markSyncFailure() {
  syncBackoffUntil = Date.now() + SYNC_BACKOFF_MS;
}

export function clearSyncBackoff() {
  syncBackoffUntil = 0;
}

/** @deprecated Use markSyncFailure */
export function markSessionUnreachable() {
  markSyncFailure();
}

/** @deprecated Use clearSyncBackoff */
export function clearSessionUnreachable() {
  clearSyncBackoff();
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

function isNetworkAvailable(state: Network.NetworkState): boolean {
  if (state.isConnected === false) {
    return false;
  }
  if (state.isInternetReachable === false) {
    return false;
  }
  return true;
}

/**
 * True when catalog sync is worth attempting.
 * Uses bundled content when the network or catalog endpoint is unreachable.
 */
export async function shouldSyncFromNetwork(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  if (Date.now() < syncBackoffUntil) {
    return false;
  }

  try {
    const state = await Network.getNetworkStateAsync();
    if (!isNetworkAvailable(state)) {
      return false;
    }
  } catch {
    return false;
  }

  return probeCatalogEndpoint();
}