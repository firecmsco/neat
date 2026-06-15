import React, { useEffect, useState } from "react";
import {
    trackPurchase,
    trackLicenseKeyRetrieved,
    trackLicenseKeyError,
    trackCopyLicenseKey,
    trackCopyCodeSnippet,
    trackLicenseBackToEditor,
} from "../utils/analytics";

const API_BASE = "https://us-central1-neat-co.cloudfunctions.net";

type LicenseState =
    | { status: "loading" }
    | { status: "success"; licenseKey: string; domain: string }
    | { status: "error"; message: string };

function CopyButton({ text, label, onCopy }: { text: string; label?: string; onCopy?: () => void }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                onCopy?.();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                copied
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:border-white/30"
            }`}
        >
            {copied ? "✓ Copied!" : (label || "Copy")}
        </button>
    );
}

export function LicenseSuccessPage() {
    const [state, setState] = useState<LicenseState>({ status: "loading" });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");

        if (!sessionId) {
            setState({ status: "error", message: "No session ID found. Please check your purchase confirmation email." });
            trackLicenseKeyError("no_session_id");
            return;
        }

        // Fire purchase event once on page load with the session ID
        trackPurchase(sessionId);

        let cancelled = false;
        let attempts = 0;
        const maxAttempts = 10;

        const fetchLicense = async () => {
            try {
                const res = await fetch(`${API_BASE}/getLicenseKey?session_id=${encodeURIComponent(sessionId)}`);
                const data = await res.json();

                if (cancelled) return;

                if (res.ok && data.licenseKey) {
                    setState({ status: "success", licenseKey: data.licenseKey, domain: data.domain });
                    trackLicenseKeyRetrieved(data.domain);
                } else if (res.status === 402) {
                    // Payment not yet processed — retry
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(fetchLicense, 2000);
                    } else {
                        const errMsg = "Payment is still processing. Please refresh this page in a moment.";
                        setState({ status: "error", message: errMsg });
                        trackLicenseKeyError("payment_processing_timeout");
                    }
                } else {
                    const errMsg = data.error || "Failed to retrieve your license key.";
                    setState({ status: "error", message: errMsg });
                    trackLicenseKeyError(errMsg);
                }
            } catch {
                if (cancelled) return;
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(fetchLicense, 2000);
                } else {
                    setState({ status: "error", message: "Network error. Please refresh the page." });
                    trackLicenseKeyError("network_error");
                }
            }
        };

        fetchLicense();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-xl">
                {state.status === "loading" && (
                    <div className="text-center">
                        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-6 py-4">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span className="text-white/70 text-sm">Retrieving your license key…</span>
                        </div>
                    </div>
                )}

                {state.status === "error" && (
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
                        <p className="text-white/60 text-sm mb-6">{state.message}</p>
                        <a href="mailto:hello@firecms.co"
                           className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            Contact support →
                        </a>
                    </div>
                )}

                {state.status === "success" && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <span className="text-3xl">✓</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-1">You're all set!</h1>
                            <p className="text-white/50 text-sm">
                                License for <span className="text-white/80 font-medium">{state.domain}</span>
                            </p>
                        </div>

                        {/* License key */}
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] tracking-widest font-bold uppercase text-white/40">
                                    Your License Key
                                </span>
                                <CopyButton text={state.licenseKey} label="Copy key" onCopy={trackCopyLicenseKey} />
                            </div>
                            <div className="bg-black/40 border border-white/10 rounded-lg p-3 break-all">
                                <code className="text-xs text-emerald-300/90 font-mono leading-relaxed">
                                    {state.licenseKey}
                                </code>
                            </div>
                        </div>

                        {/* Usage instructions */}
                        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6">
                            <span className="text-[10px] tracking-widest font-bold uppercase text-white/40 block mb-3">
                                How to use
                            </span>
                            <div className="relative">
                                <pre className="text-xs bg-black/40 text-white/90 p-4 rounded-lg border border-white/10 overflow-x-auto font-mono leading-relaxed">
{`import { NeatGradient } from "@firecms/neat";

const gradient = new NeatGradient({
    ref: document.getElementById("canvas"),
    licenseKey: "${state.licenseKey.slice(0, 30)}…",
    colors: [
        // ...your colors
    ],
});`}
                                </pre>
                                <CopyButton
                                    text={`licenseKey: "${state.licenseKey}",`}
                                    label="Copy line"
                                    onCopy={trackCopyCodeSnippet}
                                />
                            </div>
                            <div className="mt-4 space-y-2">
                                <p className="text-xs text-white/40">
                                    <span className="text-white/60">✓</span> Works on <span className="font-medium text-white/60">{state.domain}</span> and all subdomains
                                </p>
                                <p className="text-xs text-white/40">
                                    <span className="text-white/60">✓</span> Development on <code className="text-white/50">localhost</code> always works
                                </p>
                                <p className="text-xs text-white/40">
                                    <span className="text-white/60">✓</span> Removes watermark and console branding
                                </p>
                            </div>
                        </div>

                        {/* Save reminder */}
                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                            <p className="text-xs text-amber-200/70">
                                <span className="font-bold text-amber-200/90">Save this key!</span>{" "}
                                Bookmark this page or copy the key now. If you lose it, contact{" "}
                                <a href="mailto:hello@firecms.co"
                                   className="text-amber-200/90 underline underline-offset-2 hover:text-amber-100 transition-colors font-normal">
                                    hello@firecms.co
                                </a>{" "}
                                with your purchase email.
                            </p>
                        </div>

                        {/* Back to editor */}
                        <div className="text-center">
                            <a href="/"
                               onClick={() => trackLicenseBackToEditor()}
                               className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors font-normal">
                                ← Back to editor
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

