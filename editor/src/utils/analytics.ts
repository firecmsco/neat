/**
 * Centralized GA4 analytics helper.
 *
 * Stores the Firebase Analytics instance as a singleton so any component
 * can fire events without prop-drilling.
 */
import { Analytics, logEvent } from "firebase/analytics";

let _analytics: Analytics | null = null;

/** Call once after Firebase initialisation (e.g. in App.tsx). */
export function setAnalyticsInstance(analytics: Analytics) {
    _analytics = analytics;
}

/** Low-level helper – prefer the typed functions below. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
    if (_analytics) logEvent(_analytics, name, params as Record<string, string>);
}

// ── License / purchase funnel events ─────────────────────────────────────────

export function trackLicenseDialogOpen() {
    trackEvent("open_license_dialog");
}

export function trackLicenseEnterDomain(domain: string) {
    trackEvent("license_enter_domain", { domain });
}

export function trackBeginCheckout(domain: string) {
    trackEvent("begin_checkout", {
        currency: "EUR",
        value: 12,
        items: [{ item_name: "NEAT License", price: 12, quantity: 1 }],
        domain,
    });
}

export function trackCheckoutRedirect(domain: string) {
    trackEvent("checkout_redirect", { domain });
}

export function trackCheckoutError(domain: string, error: string) {
    trackEvent("checkout_error", { domain, error });
}

export function trackCheckoutCancelled() {
    trackEvent("checkout_cancelled");
}

export function trackPurchase(transactionId: string) {
    trackEvent("purchase", {
        transaction_id: transactionId,
        currency: "EUR",
        value: 12,
        items: [{ item_name: "NEAT License", price: 12, quantity: 1 }],
    });
}

export function trackLicenseKeyRetrieved(domain: string) {
    trackEvent("license_key_retrieved", { domain });
}

export function trackLicenseKeyError(error: string) {
    trackEvent("license_key_error", { error });
}

export function trackCopyLicenseKey() {
    trackEvent("copy_license_key");
}

export function trackCopyCodeSnippet() {
    trackEvent("copy_code_snippet");
}

export function trackLicenseBackToEditor() {
    trackEvent("license_back_to_editor");
}
