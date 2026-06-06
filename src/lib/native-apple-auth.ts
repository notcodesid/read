import * as AppleAuthentication from 'expo-apple-authentication';
import * as Device from 'expo-device';

import { devLog } from '@/lib/log';
import {
  activateAppleUserLibrary,
  deactivateAppleUserLibrary,
} from '@/lib/apple-reading-archive';
import {
  clearAppleSession,
  loadAppleSession,
  saveAppleSession,
} from '@/lib/apple-session-storage';
import type { AppleUserSession } from '@/types/apple-session';

/**
 * Sign in with Apple — client-only flow per Apple’s guide:
 * https://developer.apple.com/documentation/signinwithapple/authenticating-users-with-sign-in-with-apple
 *
 * Mapped to AuthenticationServices via expo-apple-authentication:
 * 1. ASAuthorizationAppleIDRequest (scopes: fullName, email)
 * 2. ASAuthorizationController → credential (user identifier + optional name/email)
 * 3. Persist first-time name/email (Apple only returns these once)
 * 4. ASAuthorizationAppleIDProvider.getCredentialState on launch
 * 5. Credential-revoked notification → clear local session
 *
 * Server steps from Apple’s doc (JWT verification, authorization code, nonce)
 * are intentionally omitted — this app does not authenticate against a backend.
 */

export async function isAppleSignInAvailable(): Promise<boolean> {
  return AppleAuthentication.isAvailableAsync();
}

const LOG = '[read:apple-auth]';

function isUserCancellation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ERR_REQUEST_CANCELED'
  );
}

function messageFromAppleError(error: unknown): string {
  if (isUserCancellation(error)) {
    return 'ERR_REQUEST_CANCELED';
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';
  const message = error instanceof Error ? error.message : String(error);

  if (__DEV__) {
    devLog(LOG, 'sign-in failed', { code, message });
  }

  if (
    message.includes('unknown reason') ||
    message.includes('authorization attempt failed') ||
    code === 'ERR_REQUEST_UNKNOWN'
  ) {
    return 'Apple could not verify your account. On Simulator: open Settings → Apple Account and sign in first, then try again. On iPhone: confirm Sign in with Apple is enabled for com.notcodesid.read in Apple Developer, then run bun run ios again.';
  }

  if (message.includes('not interactive') || code === 'ERR_REQUEST_NOT_INTERACTIVE') {
    return 'Apple sign-in was interrupted. Close other dialogs and try again.';
  }

  if (message) {
    return message;
  }

  return 'Sign in with Apple failed. Try a physical iPhone if you are on Simulator.';
}

function readFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | undefined {
  if (!fullName) {
    return undefined;
  }
  const formatted = AppleAuthentication.formatFullName(fullName, 'default').trim();
  return formatted.length > 0 ? formatted : undefined;
}

/**
 * Apple only sends fullName and email on the first successful authorization.
 * Merge with any values already stored for this user identifier.
 */
function sessionFromCredential(
  credential: AppleAuthentication.AppleAuthenticationCredential,
  existing: AppleUserSession | null,
): AppleUserSession {
  return {
    user: credential.user,
    email: credential.email ?? existing?.email,
    fullName: readFullName(credential.fullName) ?? existing?.fullName,
  };
}

/**
 * Step 4 from Apple’s doc: check credential state for the stored user identifier.
 * @see ASAuthorizationAppleIDProvider.getCredentialState(forUserID:)
 */
export async function isStoredAppleCredentialValid(user: string): Promise<boolean> {
  try {
    const state = await AppleAuthentication.getCredentialStateAsync(user);

    if (state === AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED) {
      return true;
    }

    return false;
  } catch (error) {
    // Check for specific AuthKit error codes that indicate temporary issues
    const errorCode = typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: number }).code
      : undefined;

    // Also check error message string for error codes
    const errorMessage = error instanceof Error ? error.message : String(error);
    const hasTempError = errorMessage.includes('-7084') || errorMessage.includes('-7082');

    // Error -7084: Credential not immediately available after sign-in (temporary)
    // Error -7082: Authorization not found (temporary during sign-in flow)
    if (errorCode === -7084 || errorCode === -7082 || hasTempError) {
      devLog(LOG, 'Credential state check returned temporary error, allowing session', { errorCode, hasTempError });
      return true;
    }

    // Only suppress other errors on Simulator
    if (!Device.isDevice) {
      devLog(LOG, 'Simulator credential check failed, allowing session', error);
      return true;
    }
    // On real devices, treat other errors as invalid credentials
    devLog(LOG, 'Credential check failed on device', error);
    return false;
  }
}

/** Step 2–3: perform authorization and persist the credential. */
export async function signInWithApple(): Promise<AppleUserSession> {
  if (!(await AppleAuthentication.isAvailableAsync())) {
    throw new Error('Sign in with Apple is not available on this device.');
  }

  const existing = await loadAppleSession();

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error: unknown) {
    throw new Error(messageFromAppleError(error));
  }

  if (!credential.user) {
    throw new Error('Apple did not return a user identifier.');
  }

  const session = sessionFromCredential(credential, existing);
  await saveAppleSession(session);
  await activateAppleUserLibrary(session.user);
  return session;
}

/** Local sign-out: clear app state. Apple does not require signOutAsync for native-only apps. */
export async function signOutFromApple(): Promise<void> {
  const session = await loadAppleSession();
  if (session) {
    await deactivateAppleUserLibrary(session.user);
  }
  await clearAppleSession();
}

/** Restore session on launch after validating credential state with Apple. */
export async function restoreAppleSession(): Promise<AppleUserSession | null> {
  const session = await loadAppleSession();
  if (!session) {
    return null;
  }

  if (!(await isStoredAppleCredentialValid(session.user))) {
    await clearAppleSession();
    return null;
  }

  await activateAppleUserLibrary(session.user);
  return session;
}

/** Step 5: observe credential revocation from Settings. */
export function onAppleCredentialRevoked(listener: () => void) {
  return AppleAuthentication.addRevokeListener(listener);
}