/** Neutral palette the mockups are built on, so every scene reads as one product. */
export type ShowcaseTokens = {
    dark: boolean;
    page: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    text: string;
    muted: string;
    faint: string;
    skeleton: string;
    shadow: string;
    shadowSoft: string;
};

export function showcaseTokens(dark: boolean): ShowcaseTokens {
    return dark
        ? {
            dark,
            page: "#08090B",
            surface: "#101114",
            surfaceAlt: "#17181C",
            border: "rgba(255,255,255,0.09)",
            text: "#F4F4F5",
            muted: "rgba(244,244,245,0.56)",
            faint: "rgba(244,244,245,0.26)",
            skeleton: "rgba(244,244,245,0.11)",
            shadow: "0 40px 80px -32px rgba(0,0,0,0.85), 0 12px 28px -14px rgba(0,0,0,0.7)",
            shadowSoft: "0 18px 40px -20px rgba(0,0,0,0.7)"
        }
        : {
            dark,
            page: "#F1F0ED",
            surface: "#FFFFFF",
            surfaceAlt: "#F7F6F4",
            border: "rgba(17,17,17,0.08)",
            text: "#111113",
            muted: "rgba(17,17,19,0.55)",
            faint: "rgba(17,17,19,0.24)",
            skeleton: "rgba(17,17,19,0.09)",
            shadow: "0 40px 80px -32px rgba(20,20,30,0.35), 0 12px 28px -14px rgba(20,20,30,0.18)",
            shadowSoft: "0 18px 40px -20px rgba(20,20,30,0.22)"
        };
}
