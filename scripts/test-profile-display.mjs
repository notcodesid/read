/**
 * Run: bun scripts/test-profile-display.mjs
 */

function profileInitials(fullName) {
  if (!fullName?.trim()) return null;
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function profileDisplayName(session) {
  return session.fullName?.trim() || null;
}

if (profileDisplayName({ user: '1', fullName: 'Sidharth' }) !== 'Sidharth') {
  throw new Error('should use Apple full name only');
}

if (profileDisplayName({ user: '1', email: 'sid@icloud.com' }) !== null) {
  throw new Error('should not derive a display name from email');
}

if (profileInitials('Sidharth Kumar') !== 'SK') {
  throw new Error('should build initials from Apple name');
}

if (profileInitials(undefined) !== null) {
  throw new Error('should not invent initials without Apple name');
}

console.log('profile-display ok');