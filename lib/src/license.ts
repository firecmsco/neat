/**
 * Client-side license key verification for @firecms/neat.
 *
 * License keys are ECDSA P-256 signatures over a JSON payload.
 * Format: NEAT-<base64url(payload)>.<base64url(signature)>
 *
 * The public key is embedded here; the private key lives on the server.
 * Verification uses the Web Crypto API — zero dependencies.
 */

// ── Public key (ECDSA P-256) ──
// This will be replaced with the real key after running keygen/generate-keypair.ts
const NEAT_PUBLIC_KEY_JWK: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: "n9A9jNvLNR6QJaPP4ZdpbXtPFz3ASUfeeQm11Jd53Rg",
    y: "EoG5ezJ3hr4c62JjpsyabotdFeU-A1LyH-qHyabnKc0",
    key_ops: ["verify"],
    ext: true,
};

export interface LicensePayload {
    domain: string;
    email: string;
    iat: number;
}

export interface LicenseResult {
    valid: boolean;
    payload?: LicensePayload;
}

/**
 * Decodes a base64url string to a Uint8Array.
 */
function base64urlToBytes(b64url: string): Uint8Array {
    // Restore standard base64 characters
    let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    while (b64.length % 4 !== 0) b64 += "=";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/**
 * Checks whether the current hostname matches the licensed domain.
 * - Exact match: hostname === domain
 * - Subdomain match: hostname ends with .domain
 * - Development hosts are always allowed.
 */
function isDomainMatch(licenseDomain: string): boolean {
    // In non-browser environments (SSR, Node), skip domain check
    if (typeof window === "undefined" || !window.location) return true;

    const hostname = window.location.hostname.toLowerCase();
    const domain = licenseDomain.toLowerCase();

    // Development hosts — always allowed
    if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname === "[::1]" ||
        hostname.endsWith(".localhost")
    ) {
        return true;
    }

    // Exact match
    if (hostname === domain) return true;

    // Subdomain match: hostname ends with ".domain"
    if (hostname.endsWith("." + domain)) return true;

    return false;
}

/**
 * Verifies a Neat license key.
 *
 * Returns `{ valid: true, payload }` if the signature is valid AND the
 * current hostname matches the licensed domain.
 *
 * This function never throws — it returns `{ valid: false }` on any error.
 */
export async function verifyLicenseKey(licenseKey: string): Promise<LicenseResult> {
    try {
        // Check Web Crypto availability
        if (
            typeof crypto === "undefined" ||
            !crypto.subtle ||
            typeof crypto.subtle.verify !== "function"
        ) {
            return { valid: false };
        }

        // Parse key format: NEAT-<payload>.<signature>
        if (!licenseKey.startsWith("NEAT-")) return { valid: false };

        const rest = licenseKey.slice(5); // Remove "NEAT-" prefix
        const dotIndex = rest.indexOf(".");
        if (dotIndex === -1) return { valid: false };

        const payloadB64 = rest.slice(0, dotIndex);
        const signatureB64 = rest.slice(dotIndex + 1);

        if (!payloadB64 || !signatureB64) return { valid: false };

        // Decode payload
        const payloadBytes = base64urlToBytes(payloadB64);
        const payloadJson = new TextDecoder().decode(payloadBytes);
        const payload: LicensePayload = JSON.parse(payloadJson);

        // Validate payload structure
        if (!payload.domain || typeof payload.domain !== "string") return { valid: false };

        // Check domain match
        if (!isDomainMatch(payload.domain)) return { valid: false };

        // Decode signature
        const signatureBytes = base64urlToBytes(signatureB64);

        // Import public key
        const publicKey = await crypto.subtle.importKey(
            "jwk",
            NEAT_PUBLIC_KEY_JWK,
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["verify"]
        );

        // Verify signature over the raw payload bytes (UTF-8 JSON)
        const valid = await crypto.subtle.verify(
            { name: "ECDSA", hash: "SHA-256" },
            publicKey,
            signatureBytes,
            payloadBytes
        );

        return valid ? { valid: true, payload } : { valid: false };
    } catch {
        return { valid: false };
    }
}

/**
 * Updates the embedded public key at build time.
 * This is a convenience for the keygen tooling — not called at runtime.
 */
export function _getPublicKeyJwk(): JsonWebKey {
    return NEAT_PUBLIC_KEY_JWK;
}
