import React from "react";
import { GradientSurface, SourceRef, Stage } from "../GradientSurface";
import { ShowcaseTokens } from "../theme";
import { Bar, BrowserFrame, Pill, Scrim } from "../primitives";

const NAV = ["Overview", "Projects", "Presets", "Exports", "Team", "Settings"];

const STATS = [
    { label: "Renders", value: "48.2k", delta: "+12.4%", bars: [8, 14, 11, 18, 15, 22, 19, 26] },
    { label: "Avg. FPS", value: "60.0", delta: "stable", bars: [20, 21, 20, 22, 21, 22, 21, 22] },
    { label: "Bundle", value: "17 KB", delta: "-3.1%", bars: [24, 22, 20, 21, 17, 16, 14, 13] }
];

export function DashboardScene({ source, t }: { source: SourceRef; t: ShowcaseTokens }) {
    return (
        <Stage designWidth={1200} designHeight={760} maxScale={1.05}>
            <BrowserFrame t={t} url="app.nebula.studio/overview" width={1200} height={760}>
                <div className="absolute inset-0 flex" style={{ backgroundColor: t.surface }}>

                    {/* Sidebar */}
                    <div className="shrink-0 flex flex-col px-4 py-5"
                         style={{ width: 214, backgroundColor: t.surfaceAlt, borderRight: `1px solid ${t.border}` }}>
                        <div className="flex items-center gap-2.5 px-1">
                            <div className="w-6 h-6 rounded-lg overflow-hidden"
                                 style={{ border: `1px solid ${t.border}` }}>
                                <GradientSurface source={source} cx={0.3} cy={0.35} zoom={8} fps={10}/>
                            </div>
                            <span className="text-[13px] font-semibold tracking-[-0.01em]"
                                  style={{ color: t.text }}>Nebula</span>
                            <span className="ml-auto text-[9px] font-mono" style={{ color: t.faint }}>v1.0</span>
                        </div>

                        <div className="mt-5 flex items-center gap-2 rounded-lg px-2.5"
                             style={{ height: 30, backgroundColor: t.dark ? "rgba(255,255,255,0.05)" : "rgba(17,17,19,0.04)" }}>
                            <div className="w-3 h-3 rounded-full" style={{ border: `1.5px solid ${t.faint}` }}/>
                            <span className="text-[11px]" style={{ color: t.faint }}>Search…</span>
                        </div>

                        <div className="mt-5 space-y-0.5">
                            {NAV.map((item, i) => (
                                <div key={item} className="flex items-center gap-2.5 rounded-lg px-2.5"
                                     style={{
                                         height: 32,
                                         backgroundColor: i === 0
                                             ? (t.dark ? "rgba(255,255,255,0.07)" : "rgba(17,17,19,0.05)")
                                             : "transparent"
                                     }}>
                                    <div className="w-3.5 h-3.5 rounded-[5px]"
                                         style={{ backgroundColor: t.text, opacity: i === 0 ? 0.7 : 0.22 }}/>
                                    <span className="text-[12px]"
                                          style={{ color: i === 0 ? t.text : t.muted }}>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center gap-2.5 pt-4"
                             style={{ borderTop: `1px solid ${t.border}` }}>
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0"
                                 style={{ border: `1px solid ${t.border}` }}>
                                <GradientSurface source={source} cx={0.7} cy={0.6} zoom={10} fps={10}/>
                            </div>
                            <div className="space-y-1.5">
                                <Bar w={62} h={7} color={t.text} opacity={0.3}/>
                                <Bar w={44} h={6} color={t.text} opacity={0.14}/>
                            </div>
                        </div>
                    </div>

                    {/* Main */}
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center justify-between px-6 shrink-0"
                             style={{ height: 56, borderBottom: `1px solid ${t.border}` }}>
                            <span className="text-[14px] font-semibold tracking-[-0.01em]"
                                  style={{ color: t.text }}>Overview</span>
                            <div className="flex items-center gap-3">
                                <Pill color={t.muted} border={t.border}
                                      style={{ height: 28, paddingLeft: 12, paddingRight: 12, fontSize: 11.5 }}>
                                    Last 30 days
                                </Pill>
                                <div className="w-7 h-7 rounded-full overflow-hidden"
                                     style={{ border: `1px solid ${t.border}` }}>
                                    <GradientSurface source={source} cx={0.35} cy={0.7} zoom={10} fps={10}/>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 p-6">
                            {/* Banner — the gradient as a branded surface inside a product */}
                            <div className="relative overflow-hidden shrink-0"
                                 style={{ height: 172, borderRadius: 16, boxShadow: t.shadowSoft }}>
                                <GradientSurface source={source} cx={0.5} cy={0.4} zoom={1.15}
                                                 className="absolute inset-0"/>
                                <Scrim from={0.3} to={0.12}/>
                                <div className="absolute inset-0 px-7 flex items-center justify-between text-white">
                                    <div>
                                        <div className="font-mono text-[9px] uppercase tracking-[0.18em] opacity-80">
                                            Workspace
                                        </div>
                                        <div className="mt-1.5 text-[26px] font-semibold tracking-[-0.025em]"
                                             style={{ textShadow: "0 2px 20px rgba(0,0,0,0.28)" }}>
                                            Your brand, in colour
                                        </div>
                                        <div className="mt-1.5 text-[12.5px] text-white/80 max-w-[420px]">
                                            One config powers the hero, the cards, the avatars and the exports.
                                        </div>
                                    </div>
                                    <Pill color="#111113" bg="#FFFFFF"
                                          style={{ height: 36, paddingLeft: 18, paddingRight: 18, fontSize: 12.5 }}>
                                        Customise
                                    </Pill>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-5 grid grid-cols-3 gap-4">
                                {STATS.map((s) => (
                                    <div key={s.label} className="p-4 rounded-xl"
                                         style={{ border: `1px solid ${t.border}`, backgroundColor: t.surfaceAlt }}>
                                        <div className="text-[10.5px] uppercase tracking-[0.1em]"
                                             style={{ color: t.faint }}>{s.label}</div>
                                        <div className="mt-1.5 flex items-end gap-2">
                                            <span className="text-[22px] font-semibold tracking-[-0.02em]"
                                                  style={{ color: t.text }}>{s.value}</span>
                                            <span className="text-[10.5px] mb-1"
                                                  style={{ color: t.muted }}>{s.delta}</span>
                                        </div>
                                        <div className="mt-3 flex items-end gap-[5px] h-8">
                                            {s.bars.map((b, i) => (
                                                <div key={i} className="w-[5px] rounded-full"
                                                     style={{
                                                         height: `${(b / 26) * 100}%`,
                                                         backgroundColor: t.text,
                                                         opacity: 0.12 + (i / s.bars.length) * 0.3
                                                     }}/>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Table */}
                            <div className="mt-5 rounded-xl overflow-hidden"
                                 style={{ border: `1px solid ${t.border}` }}>
                                <div className="flex items-center px-4 gap-4"
                                     style={{
                                         height: 38,
                                         backgroundColor: t.surfaceAlt,
                                         borderBottom: `1px solid ${t.border}`
                                     }}>
                                    <span className="text-[11px] font-medium w-[220px]"
                                          style={{ color: t.muted }}>Preset</span>
                                    <span className="text-[11px] font-medium flex-1"
                                          style={{ color: t.muted }}>Used in</span>
                                    <span className="text-[11px] font-medium" style={{ color: t.muted }}>Status</span>
                                </div>
                                {[
                                    { name: 148, used: 210, status: "Live" },
                                    { name: 112, used: 168, status: "Live" },
                                    { name: 132, used: 190, status: "Draft" }
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center px-4 gap-4"
                                         style={{
                                             height: 52,
                                             borderTop: i === 0 ? undefined : `1px solid ${t.border}`
                                         }}>
                                        <div className="flex items-center gap-3 w-[220px]">
                                            <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0"
                                                 style={{ border: `1px solid ${t.border}` }}>
                                                <GradientSurface source={source} cx={0.25 + i * 0.25}
                                                                 cy={0.3 + i * 0.2} zoom={9} fps={10}/>
                                            </div>
                                            <Bar w={row.name} h={8} color={t.text} opacity={0.3}/>
                                        </div>
                                        <Bar w={row.used} h={7} color={t.text} opacity={0.14}/>
                                        <div className="ml-auto">
                                            <Pill color={t.muted} border={t.border}
                                                  style={{
                                                      height: 22,
                                                      paddingLeft: 10,
                                                      paddingRight: 10,
                                                      fontSize: 10.5
                                                  }}>
                                                {row.status}
                                            </Pill>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </BrowserFrame>
        </Stage>
    );
}
