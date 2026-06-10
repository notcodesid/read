export type AppleUserSession = {
  user: string;
  email?: string;
  fullName?: string;
  photoUri?: string;
  photoUpdatedAt?: number;
  /** Unix ms — skip flaky credential checks briefly after a fresh sign-in. */
  authenticatedAt?: number;
};