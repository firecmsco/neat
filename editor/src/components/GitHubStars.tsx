import React, { useEffect, useState } from "react";
import { Github, Star } from "lucide-react";

const REPO = "FireCMSco/neat";
const CACHE_KEY = "neat.stars";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h — the count moves slowly, the API budget doesn't

function formatCount(count: number) {
    return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
}

/**
 * Replaces the shields.io badge: same information, but rendered as part of the UI
 * instead of a third-party image that ignores the theme and blocks on an external
 * host. The count is cached so a repeat visit paints instantly and costs no request.
 */
export function GitHubStars({
                                onDark,
                                onClick
                            }: {
    onDark: boolean;
    onClick?: () => void;
}) {
    const [stars, setStars] = useState<number | null>(() => {
        try {
            const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
            return cached && Date.now() - cached.at < CACHE_TTL ? cached.count : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (stars !== null) return;
        let cancelled = false;

        fetch(`https://api.github.com/repos/${REPO}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                const count = data?.stargazers_count;
                if (cancelled || typeof count !== "number") return;
                setStars(count);
                try {
                    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ count, at: Date.now() }));
                } catch {
                    // private mode, or storage full — the badge just refetches next time
                }
            })
            .catch(() => {
                // Offline or rate limited: the pill still links to the repo, without a count
            });

        return () => {
            cancelled = true;
        };
    }, [stars]);

    return (
        <a
            href={`https://github.com/${REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            aria-label={stars === null ? "Star Neat on GitHub" : `Star Neat on GitHub, ${stars} stars`}
            className="group inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-1 text-xs font-medium no-underline backdrop-blur-md transition-colors duration-200"
            style={{
                color: onDark ? "rgba(255,255,255,0.75)" : "rgba(17,17,19,0.7)",
                backgroundColor: onDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.55)",
                border: `1px solid ${onDark ? "rgba(255,255,255,0.16)" : "rgba(17,17,19,0.08)"}`
            }}
        >
            <Github className="w-3.5 h-3.5 shrink-0"/>
            <span className="hidden sm:inline">Star</span>
            <span
                className="flex items-center gap-1 pl-1.5 ml-0.5"
                style={{ borderLeft: `1px solid ${onDark ? "rgba(255,255,255,0.16)" : "rgba(17,17,19,0.1)"}` }}
            >
                <Star className="w-3 h-3 shrink-0 transition-colors duration-200 group-hover:fill-amber-300 group-hover:text-amber-300"/>
                <span className="tabular-nums" style={{ minWidth: 26 }}>
                    {stars === null ? "—" : formatCount(stars)}
                </span>
            </span>
        </a>
    );
}
