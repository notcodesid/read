import * as AppleAuthentication from 'expo-apple-authentication';
import * as Device from 'expo-device';

import { devLog } from '@/lib/log';
import {
  activateAppleUserLibrary,
  deactivateAppleUserLibrary,
} from '@/lib/apple-reading-archive';
import { readAppleIdentityClaims } from '@/lib/apple-identity-token';
import {
  enrichAppleSession,
  loadStoredAppleProfile,
  mergeAppleProfileFields,
  persistAppleProfileFields,
} from '@/lib/apple-profile-storage';
import { pickProfilePhoto } from '@/lib/pick-profile-photo';
import { saveProfilePhotoFile } from '@/lib/profile-photo';
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
/** AuthKit often returns -7084 / REVOKED immediately after sign-in; wait before trusting it. */
const CREDENTIAL_GRACE_MS = 120_000;
const CREDENTIAL_RETRY_MS = 600;

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

export function readAppleFullName(
  fullName: AppleAuthentication.AppleAuthenticationFullName | null,
): string | undefined {
  if (!fullName) {
    return undefined;
  }

  const formatted = AppleAuthentication.formatFullName(fullName, 'default').trim();
  if (formatted.length > 0) {
    return formatted;
  }

  if (fullName.nickname?.trim()) {
    return fullName.nickname.trim();
  }

  const manual = [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return manual.length > 0 ? manual : undefined;
}

/** Persist Apple-provided fields immediately — Apple only sends these once. */
async function captureAppleProfileFromCredential(
  credential: AppleAuthentication.AppleAuthenticationCredential,
): Promise<void> {
  const fullName = readAppleFullName(credential.fullName);
  const email = credential.email ?? readAppleIdentityClaims(credential.identityToken)?.email;

  if (!fullName && !email) {
    return;
  }

  await persistAppleProfileFields(credential.user, {
    fullName,
    email,
  });

  devLog(LOG, 'Captured Apple profile fields', {
    hasName: Boolean(fullName),
    hasEmail: Boolean(email),
  });
}

async function buildSessionFromCredential(
  credential: AppleAuthentication.AppleAuthenticationCredential,
  existing: AppleUserSession | null,
): Promise<AppleUserSession> {
  await captureAppleProfileFromCredential(credential);

  const stored = await loadStoredAppleProfile(credential.user);
  const jwtClaims = readAppleIdentityClaims(credential.identityToken);
  const fromCredential = sessionFromCredential(credential, existing);
  const merged = mergeAppleProfileFields(
    credential.user,
    fromCredential,
    jwtClaims?.email ? { email: jwtClaims.email } : null,
    stored,
  );

  return {
    user: credential.user,
    email: merged.email,
    fullName: merged.fullName,
    authenticatedAt: Date.now(),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTemporaryCredentialError(error: unknown): boolean {
  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: number }).code
      : undefined;
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorCode === -7084 ||
    errorCode === -7082 ||
    errorMessage.includes('-7084') ||
    errorMessage.includes('-7082')
  );
}

/**
 * Apple only sends fullName and email on the first successful authorization.
 * Merge only with a prior session for the same user identifier.
 */
export function sessionFromCredential(
  credential: Pick<
    AppleAuthentication.AppleAuthenticationCredential,
    'user' | 'email' | 'fullName'
  >,
  existing: AppleUserSession | null,
): AppleUserSession {
  const prior = existing?.user === credential.user ? existing : null;

  return {
    user: credential.user,
    email: credential.email ?? prior?.email,
    fullName: readAppleFullName(credential.fullName) ?? prior?.fullName,
  };
}

function isWithinCredentialGracePeriod(authenticatedAt?: number): boolean {
  return (
    typeof authenticatedAt === 'number' &&
    Date.now() - authenticatedAt < CREDENTIAL_GRACE_MS
  );
}

/**
 * Step 4 from Apple’s doc: check credential state for the stored user identifier.
 * @see ASAuthorizationAppleIDProvider.getCredentialState(forUserID:)
 */
export async function isStoredAppleCredentialValid(
  user: string,
  authenticatedAt?: number,
): Promise<boolean> {
  if (isWithinCredentialGracePeriod(authenticatedAt)) {
    devLog(LOG, 'Skipping credential check during post-sign-in grace period');
    return true;
  }

  const { AppleAuthenticationCredentialState: State } = AppleAuthentication;
  const maxAttempts = Device.isDevice ? 3 : 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const state = await AppleAuthentication.getCredentialStateAsync(user);

      if (state === State.AUTHORIZED || state === State.TRANSFERRED) {
        return true;
      }

      if (state === State.REVOKED || state === State.NOT_FOUND) {
        if (!Device.isDevice) {
          devLog(LOG, 'Simulator reported invalid credential state; trusting local session', {
            state,
            attempt,
          });
          if (attempt < maxAttempts - 1) {
            await sleep(CREDENTIAL_RETRY_MS * (attempt + 1));
            continue;
          }
          return true;
        }

        if (attempt < maxAttempts - 1) {
          devLog(LOG, 'Credential state not ready yet; retrying', { state, attempt });
          await sleep(CREDENTIAL_RETRY_MS * (attempt + 1));
          continue;
        }

        devLog(LOG, 'Credential no longer valid', { state });
        return false;
      }

      return false;
    } catch (error) {
      if (isTemporaryCredentialError(error)) {
        devLog(LOG, 'Temporary credential check error', { attempt });
        if (attempt < maxAttempts - 1) {
          await sleep(CREDENTIAL_RETRY_MS * (attempt + 1));
          continue;
        }
        return true;
      }

      if (!Device.isDevice) {
        devLog(LOG, 'Simulator credential check failed, allowing session', error);
        return true;
      }

      if (attempt < maxAttempts - 1) {
        await sleep(CREDENTIAL_RETRY_MS * (attempt + 1));
        continue;
      }

      devLog(LOG, 'Credential check failed on device', error);
      return false;
    }
  }

  return !Device.isDevice;
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

  const session = await buildSessionFromCredential(credential, existing);

  try {
    await activateAppleUserLibrary(session.user);
    await saveAppleSession(session);
  } catch (error) {
    try {
      await deactivateAppleUserLibrary(session.user);
    } catch (rollbackError) {
      devLog(LOG, 'Failed to roll back library swap after sign-in error', rollbackError);
    }
    throw error instanceof Error ? error : new Error('Could not finish signing in.');
  }

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

/**
 * Restore session on launch after validating credential state with Apple.
 * AsyncStorage already holds the active library for a signed-in user — only swap
 * archives during explicit sign-in / sign-out transitions.
 */
export async function restoreAppleSession(): Promise<AppleUserSession | null> {
  const session = await loadAppleSession();
  if (!session) {
    return null;
  }

  if (!(await isStoredAppleCredentialValid(session.user, session.authenticatedAt))) {
    await clearAppleSession();
    return null;
  }

  const enriched = await enrichAppleSession(session);
  if (
    enriched.fullName !== session.fullName ||
    enriched.email !== session.email ||
    enriched.photoUri !== session.photoUri ||
    enriched.photoUpdatedAt !== session.photoUpdatedAt
  ) {
    await saveAppleSession(enriched);
  }

  return enriched;
}

export async function setAppleProfilePhoto(): Promise<AppleUserSession> {
  const session = await loadAppleSession();
  if (!session) {
    throw new Error('Not signed in.');
  }

  const pickedUri = await pickProfilePhoto();
  if (!pickedUri) {
    return enrichAppleSession(session);
  }

  const photoUri = await saveProfilePhotoFile(session.user, pickedUri);
  const photoUpdatedAt = Date.now();
  await persistAppleProfileFields(session.user, { photoUri, photoUpdatedAt });

  const enriched: AppleUserSession = {
    ...(await enrichAppleSession(session)),
    photoUri,
    photoUpdatedAt,
  };
  await saveAppleSession(enriched);
  return enriched;
}

export async function reloadAppleSession(): Promise<AppleUserSession | null> {
  const session = await loadAppleSession();
  if (!session) {
    return null;
  }

  const enriched = await enrichAppleSession(session);
  await saveAppleSession(enriched);
  return enriched;
}

/** Step 5: observe credential revocation from Settings. */
export function onAppleCredentialRevoked(listener: () => void) {
  return AppleAuthentication.addRevokeListener(listener);
}