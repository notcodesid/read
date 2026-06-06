import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { devLog, devWarn } from '@/lib/log';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const LOG = '[read:catalog-sync]';
const FETCH_TIMEOUT_MS = 8_000;
export const SYNC_FETCH_TIMEOUT_MS = 8_000;
const PROBE_TIMEOUT_MS = 4_000;

type FetchOptions = {
  quiet?: boolean;
};

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
  options?: FetchOptions,
): Promise<Response> {
  const controller = new AbortController();
  const externalSignal = init?.signal;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  const timeoutId = setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort();
      if (!options?.quiet) {
        devLog(LOG, 'fetch timeout', String(input).slice(0, 120));
      }
    }
  }, timeoutMs);

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

if (!supabaseUrl || !supabasePublishableKey) {
  devWarn(LOG, 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabasePublishableKey ?? 'placeholder',
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetchWithTimeout(input, init, SYNC_FETCH_TIMEOUT_MS, { quiet: true }),
    },
  },
);

export function getSupabaseConfig() {
  return { url: supabaseUrl, key: supabasePublishableKey };
}

/** Quick check before attempting a full catalog sync. */
export async function probeCatalogEndpoint(): Promise<boolean> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return false;
  }

  try {
    const response = await fetchWithTimeout(
      `${url}/rest/v1/authors?select=id&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
      },
      PROBE_TIMEOUT_MS,
      { quiet: true },
    );
    return response.ok;
  } catch {
    return false;
  }
}