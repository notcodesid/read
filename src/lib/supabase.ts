import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const LOG = '[read:supabase]';
const FETCH_TIMEOUT_MS = 25_000;

console.log(LOG, 'init', {
  hasUrl: Boolean(supabaseUrl),
  hasKey: Boolean(supabasePublishableKey),
  url: supabaseUrl ?? '(missing)',
});

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
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
      console.warn(LOG, 'fetch timeout', String(input).slice(0, 120));
    }
  }, FETCH_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

if (!supabaseUrl || !supabasePublishableKey) {
  console.error(LOG, 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabasePublishableKey ?? 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  },
);

console.log(LOG, 'client created');

export function getSupabaseConfig() {
  return { url: supabaseUrl, key: supabasePublishableKey };
}