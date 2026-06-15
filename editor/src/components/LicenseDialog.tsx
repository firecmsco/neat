import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "./ui/dialog";
import { Button } from "./ui/button";
import {
    trackLicenseEnterDomain,
    trackBeginCheckout,
    trackCheckoutRedirect,
    trackCheckoutError,
} from "../utils/analytics";

// Cloud Function URL (direct — no hosting rewrite needed)
const API_BASE = "https://us-central1-neat-co.cloudfunctions.net";

interface LicenseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LicenseDialog({ open, onOpenChange }: LicenseDialogProps) {
    const [domain, setDomain] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizedDomain = domain
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .trim();

    const isValidDomain = normalizedDomain.length > 0 &&
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(normalizedDomain);

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
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                            onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                        />
                        <p className="text-xs text-white/40 mt-1.5">
                            Your key will work on this domain and all its subdomains.
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
                            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}
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

