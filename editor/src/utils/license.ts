/**
 * The buyer's license key, remembered in this browser so the editor can draw
 * the gradient and export PNGs and videos without the NEAT watermark.
 *
 * Verification is the library's own (see lib/src/license.ts), which accepts a
 * key for any domain when running in the editor.
 */
export { verifyLicenseKey } from "@firecms/neat/license";

const STORAGE_KEY = "neat.licenseKey";

export function loadLicenseKey(): string | null {
    try {
        return window.localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function saveLicenseKey(licenseKey: string) {
    try {
        window.localStorage.setItem(STORAGE_KEY, licenseKey);
    } catch {
        // Storage blocked: the key still applies until the page is reloaded.
    }
}

export function forgetLicenseKey() {
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // Nothing stored, then.
    }
}

/** Keys pasted out of an email often pick up line breaks and spaces. */
export function normalizeLicenseKey(input: string): string {
    return input.replace(/\s+/g, "");
}

/** Turns a verification failure into something a buyer can act on. */
export function describeLicenseError(reason: string | undefined): string {
    if (reason?.startsWith("Web Crypto")) {
        return "Your browser can't check license keys on this page. Try another browser.";
    }
    if (reason?.startsWith("Domain mismatch")) {
        return `License keys can't be activated on ${window.location.hostname}. Open the editor at neat.firecms.co.`;
    }
    return "That isn't a valid NEAT license key. Copy the whole key from your purchase email and try again.";
}
