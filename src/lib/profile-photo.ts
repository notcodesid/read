import { Directory, File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';

function safeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function profilePhotosDirectory(): Directory {
  return new Directory(Paths.document, 'profile-photos');
}

function profilePhotoFile(userId: string): File {
  return new File(profilePhotosDirectory(), `${safeUserId(userId)}.jpg`);
}

function ensureProfilePhotosDirectory(): void {
  const dir = profilePhotosDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

function assertSavedPhoto(dest: File): string {
  if (!dest.exists || dest.size <= 0) {
    throw new Error('Could not save your profile photo.');
  }
  return dest.uri;
}

async function writePhotoBytes(dest: File, bytes: Uint8Array): Promise<string> {
  if (dest.exists) {
    dest.delete();
  }
  dest.create({ overwrite: true });
  dest.write(bytes);
  return assertSavedPhoto(dest);
}

export function getProfilePhotoUri(userId: string): string | undefined {
  const file = profilePhotoFile(userId);
  return file.exists && file.size > 0 ? file.uri : undefined;
}

export async function saveProfilePhotoFile(userId: string, sourceUri: string): Promise<string> {
  ensureProfilePhotosDirectory();
  const dest = profilePhotoFile(userId);
  const destUri = dest.uri;
  const source = new File(sourceUri);

  try {
    const bytes = await source.bytes();
    if (bytes.length > 0) {
      return await writePhotoBytes(dest, bytes);
    }
  } catch {
    // Fall through — picker URIs are not always readable via the new File API.
  }

  try {
    await source.copy(dest, { overwrite: true });
    return assertSavedPhoto(dest);
  } catch {
    // Fall through to legacy APIs for photo-library URIs on iOS.
  }

  const documentDir = LegacyFileSystem.documentDirectory;
  if (!documentDir) {
    throw new Error('Could not access app storage.');
  }

  await LegacyFileSystem.makeDirectoryAsync(`${documentDir}profile-photos`, {
    intermediates: true,
  });

  const legacyInfo = await LegacyFileSystem.getInfoAsync(destUri);
  if (legacyInfo.exists) {
    await LegacyFileSystem.deleteAsync(destUri, { idempotent: true });
  }

  try {
    await LegacyFileSystem.copyAsync({ from: sourceUri, to: destUri });
    const saved = await LegacyFileSystem.getInfoAsync(destUri);
    if (saved.exists && 'size' in saved && saved.size) {
      return destUri;
    }
  } catch {
    // Fall through to base64 read/write.
  }

  const base64 = await LegacyFileSystem.readAsStringAsync(sourceUri, {
    encoding: LegacyFileSystem.EncodingType.Base64,
  });
  await LegacyFileSystem.writeAsStringAsync(destUri, base64, {
    encoding: LegacyFileSystem.EncodingType.Base64,
  });

  const saved = await LegacyFileSystem.getInfoAsync(destUri);
  if (!saved.exists || !('size' in saved) || !saved.size) {
    throw new Error('Could not save your profile photo.');
  }

  return destUri;
}