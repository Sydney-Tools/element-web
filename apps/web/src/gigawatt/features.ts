/*
Gigawatt (Sydney Tools) — feature switches for our fork of Element Web.
Kept in one place so rebases onto upstream stay cheap: upstream code is
guarded by these constants rather than deleted.
*/

/**
 * This homeserver has no end-to-end encryption (decided 8 Oct 2026), so
 * device verification, recovery keys and key storage are meaningless here.
 * When false: no "verify this device" / "unverified sessions" / key-storage
 * toasts, and no Encryption tab in the user settings.
 */
export const ENCRYPTION_UI = false;
