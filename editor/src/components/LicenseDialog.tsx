import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "./ui/dialog";
import { Button } from "./ui/button";
import {
    trackLicenseEnterDomain,
    trackBeginCheckout,
    trackCheckoutRedirect,
    trackCheckoutError,
    trackLicenseActivated,
    trackLicenseActivationError,
} from "../utils/analytics";
import { describeLicenseError, normalizeLicenseKey, verifyLicenseKey } from "../utils/license";

// Cloud Function URL (direct — no hosting rewrite needed)
const API_BASE = "https://us-central1-neat-co.cloudfunctions.net";

export type LicenseDialogView = "buy" | "activate";

interface LicenseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The view shown on opening, while no license is active. */
    initialView?: LicenseDialogView;
    /** Domain of the license active in this browser, if any. */
    licensedDomain: string | null;
    onActivate: (licenseKey: string, domain: string) => void;
    onRemove: () => void;
}

const inputClassName = "w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all";

export function LicenseDialog({ open, onOpenChange, initialView = "buy", licensedDomain, onActivate, onRemove }: LicenseDialogProps) {
    const [view, setView] = useState<LicenseDialogView>(initialView);
    const [domain, setDomain] = useState("");
    const [email, setEmail] = useState("");
    const [licenseKey, setLicenseKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setView(initialView);
            setError(null);
        }
    }, [open, initialView]);

    const normalizedDomain = domain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .trim();

    const isValidDomain = normalizedDomain.length > 0 &&
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(normalizedDomain);

    const normalizedKey = normalizeLicenseKey(licenseKey);

    const showView = (next: LicenseDialogView) => {
        setView(next);
        setError(null);
    };

    const handleCheckout = async () => {
        if (!isValidDomain) return;

        trackBeginCheckout(normalizedDomain);
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE}/createCheckoutSession`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain: normalizedDomain,
                    origin: window.location.origin,
                    ...(email ? { email } : {}),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const errMsg = data.error || "Something went wrong";
                setError(errMsg);
                trackCheckoutError(normalizedDomain, errMsg);
                return;
            }

            // Redirect to Stripe Checkout
            trackCheckoutRedirect(normalizedDomain);
            window.location.href = data.url;
        } catch (err: any) {
            setError("Network error. Please try again.");
            trackCheckoutError(normalizedDomain, "network_error");
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        if (!normalizedKey || loading) return;

        setLoading(true);
        setError(null);
        const result = await verifyLicenseKey(normalizedKey);
        setLoading(false);

        if (!result.valid || !result.payload) {
            setError(describeLicenseError(result.reason));
            trackLicenseActivationError(result.reason ?? "unknown");
            return;
        }

        trackLicenseActivated(result.payload.domain);
        setLicenseKey("");
        onActivate(normalizedKey, result.payload.domain);
    };

    const errorBanner = error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
        </div>
    );

    if (licensedDomain) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange} maxWidth="28rem">
                <DialogTitle>License active</DialogTitle>
                <DialogContent>
                    <div className="space-y-4">
                        <p className="text-sm text-white/60">
                            Licensed for <span className="text-white/90 font-medium">{licensedDomain}</span>.
                            The watermark is off in this browser, and PNG and video exports come out clean.
                        </p>
                        <p className="text-xs text-white/40">
                            On your site, pass the same key as <code className="text-white/60">licenseKey</code>.
                            It works on {licensedDomain} and all its subdomains.
                        </p>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button variant="ghost" onClick={onRemove}>
                        Remove from this browser
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    if (view === "activate") {
        return (
            <Dialog open={open} onOpenChange={onOpenChange} maxWidth="28rem">
                <DialogTitle>Activate your license</DialogTitle>
                <DialogContent>
                    <div className="space-y-5">
                        <div>
                            <label htmlFor="neat-license-key"
                                   className="block text-[10px] tracking-widest font-bold uppercase opacity-70 mb-2">
                                License key
                            </label>
                            <textarea
                                id="neat-license-key"
                                value={licenseKey}
                                onChange={(e) => {
                                    setLicenseKey(e.target.value);
                                    setError(null);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleActivate();
                                    }
                                }}
                                rows={4}
                                autoFocus
                                spellCheck={false}
                                placeholder="NEAT-…"
                                className={`${inputClassName} font-mono text-xs break-all resize-none`}
                            />
                            <p className="text-xs text-white/40 mt-1.5">
                                It's in your purchase email. Once activated, the editor drops the watermark
                                from the preview and from PNG and video exports in this browser.
                            </p>
                        </div>

                        {errorBanner}

                        <button
                            type="button"
                            onClick={() => showView("buy")}
                            className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors">
                            Don't have a key? Buy one for €12
                        </button>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!normalizedKey || loading}
                        onClick={handleActivate}
                    >
                        {loading ? "Checking…" : "Activate"}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} maxWidth="28rem">
            <DialogTitle>Remove Watermark</DialogTitle>
            <DialogContent>
                <div className="space-y-5">
                    {/* Pricing badge */}
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-white shrink-0">€12</span>
                        <span className="text-sm text-white/50 shrink-0">one-time</span>
                        <div className="h-8 w-px bg-white/10 shrink-0" />
                        <div className="text-sm text-white/60">
                            Removes the <span className="text-white/80 font-medium">NEAT</span> watermark
                            and console branding
                        </div>
                    </div>

                    {/* Domain input */}
                    <div>
                        <label className="block text-[10px] tracking-widest font-bold uppercase opacity-70 mb-2">
                            Domain
                        </label>
                        <input
                            type="text"
                            value={domain}
                            onChange={(e) => {
                                setDomain(e.target.value);
                                setError(null);
                            }}
                            onBlur={() => {
                                if (isValidDomain) trackLicenseEnterDomain(normalizedDomain);
                            }}
                            placeholder="example.com"
                            className={inputClassName}
                            onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                        />
                        <p className="text-xs text-white/40 mt-1.5">
                            Your key will work on this domain and all its subdomains, and removes the watermark
                            from PNG and video exports here in the editor.
                            Development on <code className="text-white/60">localhost</code> is always free.
                        </p>
                    </div>

                    {/* Email input (optional) */}
                    <div>
                        <label className="block text-[10px] tracking-widest font-bold uppercase opacity-70 mb-2">
                            Email <span className="text-white/30 normal-case">(optional — to receive your key)</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className={inputClassName}
                        />
                    </div>

                    {errorBanner}

                    <button
                        type="button"
                        onClick={() => showView("activate")}
                        className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors">
                        Already bought a license? Activate your key
                    </button>
                </div>
            </DialogContent>
            <DialogActions>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                    Cancel
                </Button>
                <Button
                    disabled={!isValidDomain || loading}
                    onClick={handleCheckout}
                    className={loading ? "animate-pulse" : ""}
                >
                    {loading ? "Redirecting…" : "Buy for €12 →"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
