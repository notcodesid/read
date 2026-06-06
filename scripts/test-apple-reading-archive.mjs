/**
 * Unit test for guest ↔ Apple library swap logic (no Apple APIs).
 * Run: bun scripts/test-apple-reading-archive.mjs
 */

function swap(active, archives, { appleUserId, mode }) {
  const guestKey = 'guest';
  const appleKey = `apple:${appleUserId}`;

  if (mode === 'sign-in') {
    archives[guestKey] = structuredClone(active);
    return archives[appleKey] ? structuredClone(archives[appleKey]) : structuredClone(active);
  }

  archives[appleKey] = structuredClone(active);
  return archives[guestKey] ? structuredClone(archives[guestKey]) : structuredClone(active);
}

const guest = { bookmarks: { a: 1 } };
const archives = {};

let active = structuredClone(guest);

// First sign-in: apple gets copy of guest
active = swap(active, archives, { appleUserId: 'apple-123', mode: 'sign-in' });
if (active.bookmarks.a !== 1) throw new Error('first sign-in should keep guest data');

active.bookmarks.b = 2;

// Sign-out: apple saved, guest restored
active = swap(active, archives, { appleUserId: 'apple-123', mode: 'sign-out' });
if (active.bookmarks.a !== 1 || active.bookmarks.b) throw new Error('sign-out should restore guest');

active.bookmarks.c = 3;

// Sign-in again: apple library has b, not c
active = swap(active, archives, { appleUserId: 'apple-123', mode: 'sign-in' });
if (active.bookmarks.b !== 2 || active.bookmarks.c) throw new Error('second sign-in should restore apple library');

console.log('apple-reading-archive logic ok');