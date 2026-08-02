import React from "react";
import { GradientSurface, SourceRef, Stage, useIsNarrow } from "../GradientSurface";
import { ShowcaseTokens } from "../theme";

const CARD_W = 320;
const CARD_H = 468;

const softFade: React.CSSProperties = {
    maskImage: "linear-gradient(to top, #000 46%, rgba(0,0,0,0.65) 72%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to top, #000 46%, rgba(0,0,0,0.65) 72%, transparent 100%)"
};

function Caption({ t, children }: { t: ShowcaseTokens; children: React.ReactNode }) {
    return (
        <div className="mt-4 text-[9.5px] font-mono uppercase tracking-[0.18em] text-center"
             style={{ color: t.muted }}>
            {children}
        </div>
    );
}

function Frame({
                   children,
                   offset,
                   t
               }: {
    children: React.ReactNode;
    offset: number;
    t: ShowcaseTokens;
}) {
    return (
        <div style={{ transform: `translateY(${offset}px)` }}>
            <div
                className="relative overflow-hidden"
                style={{
                    width: CARD_W,
                    height: CARD_H,
                    borderRadius: 6,
                    boxShadow: t.shadow
                }}
            >
                {children}
            </div>
        </div>
    );
}

export function CardsScene({ source, t }: { source: SourceRef; t: ShowcaseTokens }) {
    const narrow = useIsNarrow();
    return (
        <Stage designWidth={narrow ? 700 : 1120} designHeight={narrow ? 556 : 584} maxScale={1}>
            <div className="w-full h-full flex items-center justify-center gap-11">

                {/* 1 — full bleed poster */}
                <div>
                    <Frame offset={14} t={t}>
                        <GradientSurface source={source} cx={0.32} cy={0.42} zoom={1.7}
                                         className="absolute inset-0"/>
                        <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                            <div className="font-mono text-[9.5px] leading-[1.6] uppercase tracking-[0.14em]"
                                 style={{ textShadow: "0 1px 12px rgba(0,0,0,0.35)" }}>
                                <div>Aurora ✳ vol. 01</div>
                                <div className="opacity-70">Outer ＋___＋ layers</div>
                            </div>
                            <div style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}>
                                <div className="text-[30px] leading-[1.05] font-medium tracking-[-0.02em]">
                                    Colour,<br/>in motion
                                </div>
                                <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] opacity-70">
                                    Sixty frames · zero deps
                                </div>
                            </div>
                        </div>
                    </Frame>
                    <Caption t={t}>Poster · full bleed</Caption>
                </div>

                {/* 2 — light editorial, gradient rising from the base */}
                <div className={narrow ? "hidden" : undefined}>
                    <Frame offset={-16} t={t}>
                        <div className="absolute inset-0" style={{ backgroundColor: "#FCFCFB" }}/>
                        <GradientSurface source={source} cx={0.62} cy={0.58} zoom={2.1}
                                         className="absolute inset-0" style={softFade}/>
                        <div className="absolute inset-0 p-6 text-[#111113]">
                            <div className="flex items-start justify-between gap-4">
                                <div className="font-mono text-[8.5px] leading-[1.7] uppercase tracking-[0.12em]">
                                    <div className="font-semibold">Study no. 02 —</div>
                                    <div className="opacity-60">In layers · undefined</div>
                                    <div className="opacity-60">Full force · delivering ＋</div>
                                    <div className="mt-3 font-semibold">Gravity is optional —</div>
                                    <div className="opacity-60">Surface reads cosmic</div>
                                </div>
                                <div className="text-right text-[13px] leading-[1.35] tracking-[-0.01em]">
                                    From the code +++<br/>
                                    <span className="border-b border-black/25">＋ Down under</span>
                                </div>
                            </div>
                            <div
                                className="mt-14 ml-auto w-[168px] text-[7.5px] leading-[1.7] opacity-70 text-justify">
                                +++ A gradient is never one colour. It is a field, sampled — the same
                                shader, cropped three ways, rendered live. Beautiful but deadly. +++
                            </div>
                        </div>
                    </Frame>
                    <Caption t={t}>Editorial · soft fade</Caption>
                </div>

                {/* 3 — dark, gradient pooling at the bottom */}
                <div>
                    <Frame offset={8} t={t}>
                        <div className="absolute inset-0" style={{ backgroundColor: "#0A0A0C" }}/>
                        <GradientSurface source={source} cx={0.46} cy={0.72} zoom={1.45}
                                         className="absolute inset-0" style={softFade}/>
                        <div className="absolute inset-0 p-6 text-white">
                            <div className="text-[13px] leading-[1.35] tracking-[-0.01em]">
                                Night emission +++<br/>
                                <span className="border-b border-white/25">Energy ingestion</span>
                            </div>
                            <div className="mt-16 flex gap-5 font-mono text-[7.5px] leading-[1.75] uppercase tracking-[0.1em]">
                                <div className="w-[92px]">
                                    <div className="font-semibold">Darkness is alive —</div>
                                    <div className="opacity-55">Illuminated pathways pushing upward ＋</div>
                                    <div className="mt-3 font-semibold">Motion is objective —</div>
                                    <div className="opacity-55">Surface level, breathing</div>
                                </div>
                                <div className="w-[92px] opacity-55">
                                    +++ The same instance submerged in shadow. Vibrant colour bursts are the
                                    only detection mechanism, originating from ＋＋＋ key areas.
                                </div>
                            </div>
                        </div>
                    </Frame>
                    <Caption t={t}>Dark · bottom bleed</Caption>
                </div>
            </div>
        </Stage>
    );
}
