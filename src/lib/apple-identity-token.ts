type AppleIdentityClaims = {
  email?: string;
};

/** Best-effort decode of Apple's identity JWT for client-side profile hints. */
export function readAppleIdentityClaims(identityToken: string | null): AppleIdentityClaims | null {
  if (!identityToken) {
    return null;
  }

  const parts = identityToken.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    if (typeof globalThis.atob !== 'function') {
      return null;
    }

    const json = globalThis.atob(padded);
    const payload = JSON.parse(json) as { email?: unknown };

    if (typeof payload.email === 'string' && payload.email.length > 0) {
      return { email: payload.email };
    }

    return null;
  } catch {
    return null;
  }
}