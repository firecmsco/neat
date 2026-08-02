import React from "react";
import { Moon, Sun } from "lucide-react";
import { Tooltip } from "../ui/tooltip";
import { SHOWCASE_MODES, ShowcaseMode } from "./Showcase";

export function ContextSwitcher({
                                    mode,
                                    onChange,
                                    dark,
                                    onToggleDark,
                                    onDark
                                }: {
    mode: ShowcaseMode;
    onChange: (mode: ShowcaseMode) => void;
    dark: boolean;
    onToggleDark: () => void;
    /** Whether the switcher itself sits on a dark surface — drives its own glass tint. */
    onDark: boolean;
}) {
    const index = Math.max(0, SHOWCASE_MODES.findIndex((m) => m.id === mode));

    const glass = onDark
        ? "bg-black/35 border-white/10"
        : "bg-white/55 border-black/5";

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 select-none">
            <div
                className={"relative flex items-center p-1 rounded-full backdrop-blur-md border shadow-lg w-[264px] sm:w-[520px] " + glass}>
                <div
                    className="absolute top-1 bottom-1 left-1 rounded-full border shadow-sm transition-transform duration-[420ms]"
                    style={{
                        width: "calc((100% - 0.5rem) / 5)",
                        transform: `translateX(${index * 100}%)`,
                        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                        backgroundColor: onDark ? "rgba(255,255,255,0.16)" : "#FFFFFF",
                        borderColor: onDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.04)"
                    }}
                />
                {SHOWCASE_MODES.map((m, i) => {
                    const Icon = m.icon;
                    const active = i === index;
                    return (
                        <Tooltip key={m.id} title={`${m.hint}  ·  ${i + 1}`} className="flex-1 flex min-w-0">
                            <button
                                type="button"
                                aria-label={m.label}
                                aria-pressed={active}
                                onClick={() => onChange(m.id)}
                                className="relative z-10 flex-1 min-w-0 flex items-center justify-center gap-1.5 h-8 rounded-full text-[11.5px] font-medium transition-colors duration-200"
                                style={{
                                    color: onDark
                                        ? (active ? "#FFFFFF" : "rgba(255,255,255,0.58)")
                                        : (active ? "#111113" : "rgba(17,17,19,0.62)")
                                }}
                            >
                                <Icon className="w-[15px] h-[15px] shrink-0"/>
                                <span className="hidden sm:inline truncate">{m.label}</span>
                            </button>
                        </Tooltip>
                    );
                })}
            </div>

            <div
                className={"transition-all duration-300 " + (mode === "full" ? "opacity-0 scale-90 pointer-events-none w-0" : "opacity-100 scale-100")}>
                <Tooltip title={dark ? "Light surroundings" : "Dark surroundings"}>
                    <button
                        type="button"
                        aria-label="Toggle preview theme"
                        onClick={onToggleDark}
                        className={"flex items-center justify-center w-9 h-9 rounded-full backdrop-blur-md border shadow-lg transition-colors " + glass}
                        style={{ color: onDark ? "rgba(255,255,255,0.75)" : "rgba(17,17,19,0.6)" }}
                    >
                        {dark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                    </button>
                </Tooltip>
            </div>
        </div>
    );
}
