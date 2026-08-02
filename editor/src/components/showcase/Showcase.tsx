import React from "react";
import { AppWindow, LayoutDashboard, LayoutGrid, Maximize2, Smartphone } from "lucide-react";
import { GradientSurface, isHandheld, SourceRef } from "./GradientSurface";
import { showcaseTokens } from "./theme";
import { CardsScene } from "./scenes/CardsScene";
import { SiteScene } from "./scenes/SiteScene";
import { AppScene } from "./scenes/AppScene";
import { DashboardScene } from "./scenes/DashboardScene";

export const SHOWCASE_MODES = [
    { id: "full", label: "Full bleed", hint: "The gradient on its own", icon: Maximize2 },
    { id: "cards", label: "Cards", hint: "Posters and editorial cards", icon: LayoutGrid },
    { id: "site", label: "Website", hint: "Hero section and accents", icon: AppWindow },
    { id: "app", label: "Mobile", hint: "App screens and avatars", icon: Smartphone },
    { id: "dashboard", label: "Product", hint: "Dashboard banner and tiles", icon: LayoutDashboard }
] as const;

export type ShowcaseMode = typeof SHOWCASE_MODES[number]["id"];

export function isShowcaseMode(value: string | null): value is ShowcaseMode {
    return !!value && SHOWCASE_MODES.some((m) => m.id === value);
}

/**
 * Everything but `full` replaces the fullscreen canvas with a mockup. The
 * canvas keeps rendering underneath (it is the source every surface samples
 * from) — it is simply covered by this opaque layer, which also picks up its
 * colour as ambient light.
 */
export function Showcase({
                             mode,
                             source,
                             dark
                         }: {
    mode: ShowcaseMode;
    source: SourceRef;
    dark: boolean;
}) {
    if (mode === "full") return null;

    const t = showcaseTokens(dark);

    return (
        <div className="fixed inset-0 z-[5] overflow-hidden pointer-events-none"
             style={{ backgroundColor: t.page }}>

            {/* Ambient bounce light — the live gradient, blurred to nothing.
                A viewport-sized blur repaints whenever this canvas changes, so it
                refreshes slowly: the light drifts, which is all it has to do. */}
            <GradientSurface
                source={source}
                maxWidth={72}
                fps={isHandheld ? 4 : 15}
                className="absolute"
                style={{
                    left: "-15%",
                    top: "-15%",
                    width: "130%",
                    height: "130%",
                    filter: `blur(${isHandheld ? 48 : 72}px) saturate(1.3)`,
                    opacity: dark ? 0.34 : 0.5
                }}
            />
            {/* Calm the middle back down to the page colour so the mockup stays the subject */}
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(78% 68% at 50% 46%, ${t.page} 0%, ${t.page}E6 46%, ${t.page}00 100%)`
                }}
            />

            {/* Inset so scenes never collide with the editor's own chrome */}
            <div key={mode}
                 className="absolute left-0 right-0 top-[64px] bottom-[190px] sm:top-[78px] sm:bottom-[136px] showcase-enter">
                {mode === "cards" && <CardsScene source={source} t={t}/>}
                {mode === "site" && <SiteScene source={source} t={t}/>}
                {mode === "app" && <AppScene source={source} t={t}/>}
                {mode === "dashboard" && <DashboardScene source={source} t={t}/>}
            </div>
        </div>
    );
}
