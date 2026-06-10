/**
 * Unit tests for Apple auth helpers (no native APIs).
 * Run: bun scripts/test-apple-auth.mjs
 */

function sessionFromCredential(credential, existing) {
  const prior = existing?.user === credential.user ? existing : null;

  function readFullName(fullName) {
    if (!fullName) return undefined;
    const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
    const formatted = parts.join(' ').trim();
    return formatted.length > 0 ? formatted : undefined;
  }

  return {
    user: credential.user,
    email: credential.email ?? prior?.email,
    fullName: readFullName(credential.fullName) ?? prior?.fullName,
  };
}

const userA = 'apple-user-a';
const userB = 'apple-user-b';

const existingA = { user: userA, email: 'a@icloud.com', fullName: 'Ada Lovelace' };

const firstSignIn = sessionFromCredential(
  { user: userA, email: 'a@icloud.com', fullName: { givenName: 'Ada', familyName: 'Lovelace' } },
  null,
);
if (firstSignIn.email !== 'a@icloud.com' || firstSignIn.fullName !== 'Ada Lovelace') {
  throw new Error('first sign-in should persist Apple profile fields');
}

const repeatSignIn = sessionFromCredential(
  { user: userA, email: null, fullName: null },
  existingA,
);
if (repeatSignIn.email !== 'a@icloud.com' || repeatSignIn.fullName !== 'Ada Lovelace') {
  throw new Error('repeat sign-in should merge stored profile for same user');
}

const differentUser = sessionFromCredential(
  { user: userB, email: 'b@icloud.com', fullName: { givenName: 'Bob', familyName: 'Builder' } },
  existingA,
);
if (differentUser.email !== 'b@icloud.com' || differentUser.fullName !== 'Bob Builder') {
  throw new Error('new user should not inherit prior user profile fields');
}
if (differentUser.email === existingA.email) {
  throw new Error('new user must not reuse prior user email');
}

function isWithinCredentialGracePeriod(authenticatedAt, now = Date.now()) {
  return typeof authenticatedAt === 'number' && now - authenticatedAt < 120_000;
}

if (!isWithinCredentialGracePeriod(Date.now() - 1_000)) {
  throw new Error('recent sign-in should be inside grace period');
}
if (isWithinCredentialGracePeriod(Date.now() - 130_000)) {
  throw new Error('stale sign-in should be outside grace period');
}

console.log('apple-auth session merge ok');