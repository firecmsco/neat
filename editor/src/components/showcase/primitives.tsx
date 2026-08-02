import React from "react";
import { ShowcaseTokens } from "./theme";

/** Skeleton line — stands in for body copy without shouting placeholder. */
export function Bar({
                        w,
                        h = 8,
                        color,
                        opacity = 1,
                        className,
                        style
                    }: {
    w: number | string;
    h?: number;
    color: string;
    opacity?: number;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={"rounded-full " + (className ?? "")}
            style={{ width: w, height: h, backgroundColor: color, opacity, ...style }}
        />
    );
}

export function TrafficLights() {
    return (
        <div className="flex items-center gap-2">
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c, opacity: 0.85 }}/>
            ))}
        </div>
    );
}

/** Browser chrome shared by the site and dashboard scenes. */
export function BrowserFrame({
                                 t,
                                 url,
                                 width,
                                 height,
                                 children
                             }: {
    t: ShowcaseTokens;
    url: string;
    width: number;
    height: number;
    children: React.ReactNode;
}) {
    return (
        <div
            className="overflow-hidden flex flex-col"
            style={{
                width,
                height,
                borderRadius: 18,
                backgroundColor: t.surface,
                border: `1px solid ${t.border}`,
                boxShadow: t.shadow
            }}
        >
            <div
                className="flex items-center gap-4 px-5 shrink-0"
                style={{ height: 46, backgroundColor: t.surfaceAlt, borderBottom: `1px solid ${t.border}` }}
            >
                <TrafficLights/>
                <div
                    className="flex-1 flex items-center justify-center gap-2 rounded-md mx-auto max-w-[320px]"
                    style={{ height: 24, backgroundColor: t.dark ? "rgba(255,255,255,0.06)" : "rgba(17,17,19,0.05)" }}
                >
                    <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ opacity: 0.45 }}>
                        <path d="M2 4.5V3a2.5 2.5 0 1 1 5 0v1.5" stroke={t.text} strokeWidth="1.2"
                              strokeLinecap="round"/>
                        <rect x="1" y="4.5" width="7" height="5.5" rx="1.2" fill={t.text} opacity="0.5"/>
                    </svg>
                    <span className="text-[10.5px] tracking-wide" style={{ color: t.muted }}>{url}</span>
                </div>
                <div className="flex items-center gap-1.5 w-[52px] justify-end">
                    <Bar w={13} h={2} color={t.text} opacity={0.28}/>
                    <Bar w={13} h={2} color={t.text} opacity={0.28}/>
                </div>
            </div>
            <div className="flex-1 min-h-0 relative">{children}</div>
        </div>
    );
}

/** Rounded pill button used across the mockups. */
export function Pill({
                         children,
                         bg,
                         color,
                         border,
                         className,
                         style
                     }: {
    children: React.ReactNode;
    bg?: string;
    color: string;
    border?: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div
            className={"inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap " + (className ?? "")}
            style={{ backgroundColor: bg, color, border: border ? `1px solid ${border}` : undefined, ...style }}
        >
            {children}
        </div>
    );
}

/** Soft top-down scrim so white type stays legible over any gradient. */
export function Scrim({ from = 0.42, to = 0.06 }: { from?: number; to?: number }) {
    return (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, rgba(0,0,0,${from}), rgba(0,0,0,${to}))` }}
        />
    );
}
