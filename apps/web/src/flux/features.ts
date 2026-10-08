/*
Flux (Sydney Tools) — feature switches for our fork of Element Web.
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

/**
 * Accounts come from Zitadel (Google SSO); there are no Matrix passwords to
 * set or change. When false: no "Set a new account password" panel.
 */
export const LOCAL_PASSWORDS = false;

/** Our built-in theme (res/themes/flux). Light first (Luke, 8 Oct 2026). */
export const FLUX_THEME = "flux";
export const FLUX_THEME_IS_DARK = false;

/** Built-in theme ids that are dark; upstream only knows "dark" and "dark-hc". */
export function isDarkBuiltInTheme(themeId: string): boolean {
    if (themeId === FLUX_THEME) return FLUX_THEME_IS_DARK;
    return themeId === "dark" || themeId === "dark-hc";
}

/** Whether a stylesheet name should get Compound's light token set. */
export function isLightStylesheet(stylesheetName: string): boolean {
    if (stylesheetName === FLUX_THEME) return !FLUX_THEME_IS_DARK;
    return stylesheetName.includes("light");
}
