import React from "react";
import { GradientSurface, SourceRef, Stage, useIsNarrow } from "../GradientSurface";
import { ShowcaseTokens } from "../theme";
import { Bar, Pill, Scrim } from "../primitives";

const PHONE_W = 316;
const PHONE_H = 646;

function Phone({
                   t,
                   rotate,
                   offsetY,
                   screenColor,
                   children
               }: {
    t: ShowcaseTokens;
    rotate: number;
    offsetY: number;
    screenColor: string;
    children: React.ReactNode;
}) {
    return (
        <div style={{ transform: `translateY(${offsetY}px) rotate(${rotate}deg)` }}>
            <div
                style={{
                    width: PHONE_W,
                    height: PHONE_H,
                    borderRadius: 46,
                    padding: 9,
                    backgroundColor: "#0B0B0D",
                    border: "1px solid rgba(255,255,255,0.14)",
                    boxShadow: t.shadow
                }}
            >
                <div className="relative w-full h-full overflow-hidden"
                     style={{ borderRadius: 38, backgroundColor: screenColor }}>
                    {children}
                    <div className="absolute left-1/2 -translate-x-1/2 rounded-full z-20"
                         style={{ top: 10, width: 84, height: 23, backgroundColor: "#0B0B0D" }}/>
                </div>
            </div>
        </div>
    );
}

function StatusBar({ color }: { color: string }) {
    return (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-7 z-10"
             style={{ height: 44, color }}>
            <span className="text-[11.5px] font-semibold tracking-tight">9:41</span>
            <div className="flex items-center gap-1.5" style={{ paddingRight: 2 }}>
                <Bar w={15} h={7} color={color} opacity={0.9}/>
                <Bar w={11} h={7} color={color} opacity={0.9}/>
                <Bar w={20} h={8} color={color} opacity={0.9} style={{ borderRadius: 3 }}/>
            </div>
        </div>
    );
}

export function AppScene({ source, t }: { source: SourceRef; t: ShowcaseTokens }) {
    const narrow = useIsNarrow();
    return (
        <Stage designWidth={narrow ? 360 : 880} designHeight={narrow ? 700 : 720}>
            <div className="w-full h-full flex items-center justify-center gap-14">

                {/* Onboarding — gradient as the whole screen */}
                <Phone t={t} rotate={narrow ? 0 : -3.5} offsetY={narrow ? 0 : 16} screenColor="#0B0B0D">
                    <GradientSurface source={source} cx={0.34} cy={0.48} zoom={1.7} className="absolute inset-0"/>
                    <Scrim from={0.18} to={0.55}/>
                    <StatusBar color="#FFFFFF"/>
                    <div className="absolute inset-0 flex flex-col justify-end p-7 pb-11 text-white">
                        <div className="w-11 h-11 rounded-2xl mb-6 overflow-hidden ring-1 ring-white/40">
                            <GradientSurface source={source} cx={0.75} cy={0.25} zoom={6}/>
                        </div>
                        <div className="text-[32px] leading-[1.08] font-semibold tracking-[-0.03em]"
                             style={{ textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}>
                            Every session,<br/>a new sky
                        </div>
                        <p className="mt-3 text-[13px] leading-relaxed text-white/80">
                            The background never loops. It drifts, all sixty frames of it, for as long as
                            you keep the app open.
                        </p>
                        <Pill color="#111113" bg="#FFFFFF" className="mt-7 w-full"
                              style={{ height: 46, fontSize: 14 }}>
                            Get started
                        </Pill>
                        <div className="mt-4 text-center text-[12px] text-white/65">I already have an account</div>
                    </div>
                </Phone>

                {/* Home — gradient as a hero card and avatars */}
                {!narrow && (
                <Phone t={t} rotate={3.5} offsetY={-16} screenColor={t.surface}>
                    <StatusBar color={t.text}/>
                    <div className="absolute inset-0 pt-12 px-5 flex flex-col">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[11px]" style={{ color: t.muted }}>Good evening</div>
                                <div className="text-[19px] font-semibold tracking-[-0.02em]"
                                     style={{ color: t.text }}>Studio
                                </div>
                            </div>
                            <div className="w-9 h-9 rounded-full overflow-hidden"
                                 style={{ border: `1px solid ${t.border}` }}>
                                <GradientSurface source={source} cx={0.6} cy={0.3} zoom={8}/>
                            </div>
                        </div>

                        <div className="relative mt-5 overflow-hidden shrink-0"
                             style={{ height: 196, borderRadius: 26, boxShadow: t.shadowSoft }}>
                            <GradientSurface source={source} cx={0.55} cy={0.6} zoom={1.9}
                                             className="absolute inset-0"/>
                            <Scrim from={0.1} to={0.45}/>
                            <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
                                <div className="font-mono text-[8.5px] uppercase tracking-[0.18em] opacity-80">
                                    Now playing
                                </div>
                                <div className="mt-1 text-[19px] font-semibold tracking-[-0.02em]">Deep field</div>
                                <div className="text-[11.5px] opacity-75">Ambient · 42 min</div>
                            </div>
                            <div className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
                                 style={{ backgroundColor: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.35)" }}>
                                <div style={{
                                    width: 0,
                                    height: 0,
                                    marginLeft: 3,
                                    borderTop: "6px solid transparent",
                                    borderBottom: "6px solid transparent",
                                    borderLeft: "9px solid #FFFFFF"
                                }}/>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="text-[12.5px] font-semibold" style={{ color: t.text }}>Recent</div>
                            <div className="text-[11px]" style={{ color: t.faint }}>See all</div>
                        </div>

                        <div className="mt-3 space-y-3.5">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                                         style={{ border: `1px solid ${t.border}` }}>
                                        <GradientSurface source={source} cx={0.2 + i * 0.28} cy={0.7 - i * 0.2}
                                                         zoom={9}/>
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <Bar w={[112, 92, 128][i]} h={8} color={t.text} opacity={0.32}/>
                                        <Bar w={[64, 78, 56][i]} h={6} color={t.text} opacity={0.14}/>
                                    </div>
                                    <Bar w={22} h={6} color={t.text} opacity={0.12}/>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto mb-5 flex items-center justify-between px-6 rounded-2xl"
                             style={{
                                 height: 56,
                                 backgroundColor: t.surfaceAlt,
                                 border: `1px solid ${t.border}`
                             }}>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="w-5 h-5 rounded-md"
                                     style={{
                                         backgroundColor: t.text,
                                         opacity: i === 0 ? 0.75 : 0.16
                                     }}/>
                            ))}
                        </div>
                    </div>
                </Phone>
                )}
            </div>
        </Stage>
    );
}
