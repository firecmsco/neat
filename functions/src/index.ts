import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import * as crypto from "crypto";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();

// ── Secrets ──────────────────────────────────────────────────────────────────
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecretKey = defineSecret("STRIPE_WEBHOOK_SECRET");
const neatLicensePrivateKey = defineSecret("NEAT_LICENSE_PRIVATE_KEY");
const mailersendApiKey = defineSecret("MAILERSEND_API_KEY");
// ── Helpers ──────────────────────────────────────────────────────────────────

function getStripe(): Stripe {
    const key = stripeSecretKey.value();
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    return new Stripe(key, { apiVersion: "2024-12-18.acacia" as any });
}

function getWebhookSecret(): string {
    const secret = stripeWebhookSecretKey.value();
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    return secret;
}

async function getPrivateKey(): Promise<CryptoKey> {
    const jwkStr = neatLicensePrivateKey.value();
    if (!jwkStr) throw new Error("NEAT_LICENSE_PRIVATE_KEY not configured");
    const jwk = JSON.parse(jwkStr);
    return crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
    );
}

function bytesToBase64url(bytes: Uint8Array): string {
    const binary = String.fromCharCode(...bytes);
    return Buffer.from(binary, "binary")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function signLicenseKey(domain: string, email: string): Promise<string> {
    const privateKey = await getPrivateKey();
    const payload = {
        domain,
        email,
        iat: Math.floor(Date.now() / 1000),
    };
    const payloadJson = JSON.stringify(payload);
    const payloadBytes = new TextEncoder().encode(payloadJson);

    const signature = await crypto.subtle.sign(
        { name: "ECDSA", hash: "SHA-256" },
        privateKey,
        payloadBytes
    );

    const payloadB64 = bytesToBase64url(payloadBytes);
    const signatureB64 = bytesToBase64url(new Uint8Array(signature));

    return `NEAT-${payloadB64}.${signatureB64}`;
}

// ── Stripe price ─────────────────────────────────────────────────────────────
const NEAT_PRICE_ID = "price_1TiMpBJyaHi9SqEVJKHk3Dla"; // €12

// ── Cloud Functions ──────────────────────────────────────────────────────────

/**
 * Creates a Stripe Checkout session for a Neat license purchase.
 *
 * Expects JSON body: { domain: string, email?: string }
 * Returns: { url: string } — the Stripe Checkout URL to redirect to.
 */
export const createCheckoutSession = functions.runWith({ secrets: [stripeSecretKey] }).https.onRequest(async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    try {
        const { domain, email, origin } = req.body;

        if (!domain || typeof domain !== "string") {
            res.status(400).json({ error: "domain is required" });
            return;
        }

        // Normalize domain
        const normalizedDomain = domain
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .replace(/\/.*$/, "")
            .trim();

        if (!normalizedDomain || normalizedDomain.includes(" ")) {
            res.status(400).json({ error: "Invalid domain format" });
            return;
        }

        const stripe = getStripe();

        // Use the client's origin so redirects work on localhost too
        const baseUrl = (origin && typeof origin === "string" && (origin.startsWith("http://localhost") || origin.startsWith("https://")))
            ? origin.replace(/\/+$/, "")
            : "https://neat.firecms.co";

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: "payment",
            payment_method_types: ["card"],
            allow_promotion_codes: true,
            line_items: [
                {
                    price: NEAT_PRICE_ID,
                    quantity: 1,
                },
            ],
            metadata: {
                domain: normalizedDomain,
            },
            success_url: `${baseUrl}/license/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/?checkout_cancelled=1`,
        };

        // Pre-fill email if provided
        if (email && typeof email === "string") {
            sessionParams.customer_email = email;
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        // Log funnel step
        await db.collection("license_events").add({
            step: "checkout_created",
            domain: normalizedDomain,
            email: email || null,
            stripeSessionId: session.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ url: session.url });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

/**
 * Stripe webhook handler.
 * Listens for checkout.session.completed, generates a signed license key,
 * and stores it in Firestore.
 */
async function sendLicenseEmail(email: string, domain: string, licenseKey: string): Promise<void> {
    const apiKey = mailersendApiKey.value();
    if (!apiKey) {
        console.warn("MAILERSEND_API_KEY not set — skipping email");
        return;
    }

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 0;">
    <h2 style="color: #fff; margin: 0 0 8px;">Your NEAT License Key</h2>
    <p style="color: #aaa; font-size: 14px; margin: 0 0 24px;">License for <strong style="color: #fff;">${domain}</strong></p>

    <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <code style="color: #6ee7b7; font-size: 12px; word-break: break-all; line-height: 1.6;">${licenseKey}</code>
    </div>

    <div style="font-size: 13px; color: #888; line-height: 1.7;">
        <p style="margin: 0 0 12px;"><strong style="color: #ccc;">Usage:</strong></p>
        <pre style="background: #1a1a1a; border: 1px solid #333; border-radius: 6px; padding: 12px; font-size: 12px; color: #ddd; overflow-x: auto;">new NeatGradient({
    ref: canvas,
    licenseKey: "${licenseKey.slice(0, 20)}…",
    // ...your config
});</pre>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #333; font-size: 12px; color: #666;">
        <p style="margin: 0;">✓ Works on ${domain} and all subdomains</p>
        <p style="margin: 4px 0 0;">✓ localhost always works for development</p>
    </div>
</div>
`;

    try {
        const response = await fetch("https://api.mailersend.com/v1/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: { email: "hello@firecms.co", name: "NEAT by FireCMS" },
                to: [{ email }],
                subject: `Your NEAT license key for ${domain}`,
                html,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("MailerSend error:", response.status, text);
        } else {
            console.log(`License email sent to ${email}`);
        }
    } catch (err: any) {
        console.error("Failed to send license email:", err.message);
    }
}

export const stripeWebhook = functions.runWith({ secrets: [stripeSecretKey, stripeWebhookSecretKey, neatLicensePrivateKey, mailersendApiKey] }).https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }

    const stripe = getStripe();
    const sig = req.headers["stripe-signature"];

    if (!sig) {
        res.status(400).send("Missing stripe-signature header");
        return;
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            getWebhookSecret()
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const domain = session.metadata?.domain;
        const email = session.customer_details?.email || session.customer_email || "";

        if (!domain) {
            // Not a Neat license purchase — different product, skip silently
            console.log("Skipping non-Neat checkout session:", session.id);
            res.json({ received: true });
            return;
        }

        try {
            // Generate the signed license key
            const licenseKey = await signLicenseKey(domain, email);

            // Store in Firestore
            await db.collection("licenses").doc(session.id).set({
                domain,
                email,
                licenseKey,
                stripeSessionId: session.id,
                stripeCustomerId: session.customer,
                amountTotal: session.amount_total,
                currency: session.currency,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            console.log(`License generated for ${domain} (session: ${session.id})`);

            // Log funnel step
            await db.collection("license_events").add({
                step: "payment_completed",
                domain,
                email,
                stripeSessionId: session.id,
                amountTotal: session.amount_total,
                currency: session.currency,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Send license key by email
            if (email) {
                await sendLicenseEmail(email, domain, licenseKey);
            }
        } catch (error: any) {
            console.error("Error generating license:", error);
            res.status(500).send("Error generating license");
            return;
        }
    }

    res.json({ received: true });
});

/**
 * Retrieves a license key for a completed Stripe session.
 * Used by the success page after checkout redirect.
 *
 * Expects: GET ?session_id=cs_xxx
 * Returns: { licenseKey: string, domain: string }
 */
export const getLicenseKey = functions.runWith({ secrets: [stripeSecretKey, neatLicensePrivateKey] }).https.onRequest(async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }

    if (req.method !== "GET") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const sessionId = req.query.session_id as string;
    if (!sessionId) {
        res.status(400).json({ error: "session_id is required" });
        return;
    }

    try {
        // Verify the session is actually paid via Stripe
        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            res.status(402).json({ error: "Payment not completed" });
            return;
        }

        // Retrieve from Firestore
        const doc = await db.collection("licenses").doc(sessionId).get();

        if (!doc.exists) {
            // Webhook might not have fired yet — generate now
            const domain = session.metadata?.domain;
            const email = session.customer_details?.email || session.customer_email || "";

            if (!domain) {
                res.status(404).json({ error: "License not found and no domain in metadata" });
                return;
            }

            const licenseKey = await signLicenseKey(domain, email);

            await db.collection("licenses").doc(sessionId).set({
                domain,
                email,
                licenseKey,
                stripeSessionId: sessionId,
                stripeCustomerId: session.customer,
                amountTotal: session.amount_total,
                currency: session.currency,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            res.json({ licenseKey, domain });
            return;
        }

        const data = doc.data()!;

        // Log funnel step
        await db.collection("license_events").add({
            step: "key_retrieved",
            domain: data.domain,
            stripeSessionId: sessionId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
            licenseKey: data.licenseKey,
            domain: data.domain,
        });
    } catch (error: any) {
        console.error("Error retrieving license:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});
