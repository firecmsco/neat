import React from "react";
import { GradientSurface, SourceRef, Stage } from "../GradientSurface";
import { ShowcaseTokens } from "../theme";
import { Bar, BrowserFrame, Pill, Scrim } from "../primitives";

const NAV = ["Product", "Showcase", "Pricing", "Docs"];

const FEATURES = [
    { title: "Runs on the GPU", body: "A single fragment shader. No canvas loops, no image sequences." },
    { title: "Weighs nothing", body: "17 KB gzipped, zero dependencies, no framework required." },
    { title: "Fully yours", body: "Every parameter animatable at runtime, exported as plain JSON." }
];

export function SiteScene({ source, t }: { source: SourceRef; t: ShowcaseTokens }) {
    return (
        <Stage designWidth={1200} designHeight={760} maxScale={1.05}>
            <BrowserFrame t={t} url="nebula.studio" width={1200} height={760}>
                <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: t.surface }}>

                    {/* Hero — the gradient doing what it does best */}
                    <div className="relative shrink-0 overflow-hidden" style={{ height: 424 }}>
                        <GradientSurface source={source} cx={0.5} cy={0.45}
                                         className="absolute inset-0"/>
                        <Scrim from={0.4} to={0.1}/>

                        <div className="relative h-full flex flex-col text-white">
                            <div className="flex items-center justify-between px-10 shrink-0" style={{ height: 72 }}>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-lg overflow-hidden ring-1 ring-white/40">
                                        <GradientSurface source={source} cx={0.25} cy={0.3} zoom={5} fps={10}/>
                                    </div>
                                    <span className="text-[15px] font-semibold tracking-[-0.01em]">Nebula</span>
                                </div>
                                <div className="flex items-center gap-7 text-[12.5px] text-white/80">
                                    {NAV.map((n) => <span key={n}>{n}</span>)}
                                </div>
                                <Pill color="#111113" bg="#FFFFFF"
                                      style={{ height: 32, paddingLeft: 16, paddingRight: 16, fontSize: 12.5 }}>
                                    Get started
                                </Pill>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center text-center px-10 pb-6">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10.5px] tracking-wide"
                                     style={{ backgroundColor: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.22)" }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"/>
                                    v1.0 — now dependency free
                                </div>
                                <h1 className="text-[52px] leading-[1.02] font-semibold tracking-[-0.035em] max-w-[620px]"
                                    style={{ textShadow: "0 2px 30px rgba(0,0,0,0.28)" }}>
                                    Backgrounds that breathe
                                </h1>
                                <p className="mt-4 text-[14.5px] leading-relaxed text-white/85 max-w-[430px]">
                                    Animated 3D gradients, rendered live in WebGL. Drop one behind your hero
                                    and it never renders the same frame twice.
                                </p>
                                <div className="mt-7 flex items-center gap-3">
                                    <Pill color="#111113" bg="#FFFFFF"
                                          style={{ height: 40, paddingLeft: 22, paddingRight: 22, fontSize: 13.5 }}>
                                        Start building
                                    </Pill>
                                    <Pill color="#FFFFFF" bg="rgba(255,255,255,0.14)" border="rgba(255,255,255,0.3)"
                                          style={{ height: 40, paddingLeft: 22, paddingRight: 22, fontSize: 13.5 }}>
                                        View presets
                                    </Pill>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page body — the gradient reduced to small accents */}
                    <div className="flex-1 px-10 pt-9" style={{ backgroundColor: t.surface }}>
                        <div className="grid grid-cols-3 gap-8">
                            {FEATURES.map((f, i) => (
                                <div key={f.title}>
                                    <div className="w-9 h-9 rounded-[10px] overflow-hidden"
                                         style={{ border: `1px solid ${t.border}` }}>
                                        <GradientSurface source={source} cx={0.2 + i * 0.3} cy={0.35 + i * 0.15}
                                                         zoom={7} fps={10}/>
                                    </div>
                                    <div className="mt-3.5 text-[13.5px] font-semibold tracking-[-0.01em]"
                                         style={{ color: t.text }}>
                                        {f.title}
                                    </div>
                                    <div className="mt-1.5 text-[11.5px] leading-[1.6]" style={{ color: t.muted }}>
                                        {f.body}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-9 flex items-center justify-between pt-6"
                             style={{ borderTop: `1px solid ${t.border}` }}>
                            <div className="flex items-center gap-2.5">
                                <Bar w={64} h={7} color={t.text} opacity={0.22}/>
                                <Bar w={40} h={7} color={t.text} opacity={0.12}/>
                            </div>
                            <div className="flex items-center gap-7">
                                {[52, 44, 60, 38].map((w, i) => (
                                    <Bar key={i} w={w} h={6} color={t.text} opacity={0.14}/>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </BrowserFrame>
        </Stage>
    );
}
