import React, { useState } from "react";
import JSON5 from 'json5';

import { NeatConfig } from "@firecms/neat";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
        >
            {copied ? "Copied!" : "Copy"}
        </button>
    );
}

/** Simple JS/HTML syntax highlighter */
function highlightCode(code: string, lang: "js" | "html" | "json" | "shell"): React.ReactNode[] {
    if (lang === "shell") {
        return [<span key="sh" style={{ color: "#c3e88d" }}>{code}</span>];
    }

    if (lang === "html") {
        return [<span key="html" style={{ color: "#89ddff" }}>{code}</span>];
    }

    if (lang === "json") {
        return code.split("\n").map((line, i) => {
            const highlighted = line
                // keys
                .replace(/^(\s*)(\w+)(:)/gm, (_, ws, key, colon) =>
                    `${ws}<k>${key}</k>${colon}`)
                // strings
                .replace(/(["'])([^"']*)\1/g, `<s>$1$2$1</s>`)
                // numbers & booleans
                .replace(/\b(\d+\.?\d*)\b/g, `<n>$1</n>`)
                .replace(/\b(true|false)\b/g, `<n>$1</n>`);

            return <span key={i}>{parseTags(highlighted)}{"\n"}</span>;
        });
    }

    // JS
    return code.split("\n").map((line, i) => {
        // comments
        if (line.trimStart().startsWith("//")) {
            return <span key={i} style={{ color: "rgba(255,255,255,0.3)" }}>{line}{"\n"}</span>;
        }

        const highlighted = line
            // keywords
            .replace(/\b(import|from|const|new|window)\b/g, `<k>$1</k>`)
            // strings
            .replace(/(["'`])([^"'`]*)\1/g, `<s>$1$2$1</s>`)
            // numbers
            .replace(/\b(\d+\.?\d*)\b/g, `<n>$1</n>`)
            // booleans
            .replace(/\b(true|false)\b/g, `<n>$1</n>`)
            // function/class names after new or import
            .replace(/\b(NeatGradient|getElementById|addEventListener)\b/g, `<f>$1</f>`);

        return <span key={i}>{parseTags(highlighted)}{"\n"}</span>;
    });
}

/** Parse our custom <k>, <s>, <n>, <f> tags into styled spans */
function parseTags(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    const tagRegex = /<(k|s|n|f)>(.*?)<\/\1>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const colors: Record<string, string> = {
        k: "#c792ea", // keywords - purple
        s: "#c3e88d", // strings - green
        n: "#f78c6c", // numbers/bools - orange
        f: "#82aaff", // functions - blue
    };

    while ((match = tagRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        parts.push(
            <span key={`${match.index}`} style={{ color: colors[match[1]] }}>
                {match[2]}
            </span>
        );
        lastIndex = tagRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}

function HighlightedCode({ code, lang }: { code: string; lang: "js" | "html" | "json" | "shell" }) {
    return <>{highlightCode(code, lang)}</>;
}

export function GetCodeDialog({
                               open,
                               onOpenChange,
                               config
                           }: {
    open: boolean,
    onOpenChange: (open: boolean) => void;
    config: NeatConfig
}) {
    const configStr = JSON5.stringify(config, null, 4);

    const installCmd = `npm install @firecms/neat`;

    const canvasHtml = `<canvas id="gradient" style="width: 100%; height: 100%"></canvas>`;

    const fullCode = `import { NeatGradient } from "@firecms/neat";

const config = ${configStr};

const gradient = new NeatGradient({
    ref: document.getElementById("gradient"),
    ...config
});

// Optional: react to scroll
window.addEventListener("scroll", () => {
    gradient.yOffset = window.scrollY;
});`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange} maxWidth={"2xl"}>

            <DialogTitle>
                <div className="flex items-center justify-between w-full">
                    <span>Get the code</span>
                    <div className="flex items-center gap-3 text-sm font-normal">
                        <a href="https://github.com/FireCMSco/neat"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-blue-400 hover:text-blue-300 transition-colors">
                            GitHub ⭐
                        </a>
                        <a href="https://www.npmjs.com/package/@firecms/neat"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-blue-400 hover:text-blue-300 transition-colors">
                            npm
                        </a>
                    </div>
                </div>
            </DialogTitle>

            <DialogContent>
                <div className="space-y-5 text-white">

                    {/* Step 1: Install */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-2">1. Install</h3>
                        <div className="relative">
                            <pre className="text-sm bg-black/40 text-white p-3 rounded-lg border border-white/10 overflow-auto font-mono">
                                <code><HighlightedCode code={installCmd} lang="shell" /></code>
                            </pre>
                            <CopyButton text={installCmd} />
                        </div>
                    </div>

                    {/* Step 2: Add canvas */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-2">2. Add a canvas element</h3>
                        <div className="relative">
                            <pre className="text-sm bg-black/40 text-white p-3 rounded-lg border border-white/10 overflow-auto font-mono">
                                <code><HighlightedCode code={canvasHtml} lang="html" /></code>
                            </pre>
                            <CopyButton text={canvasHtml} />
                        </div>
                    </div>

                    {/* Step 3: Initialize */}
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50 mb-2">3. Initialize with your config</h3>
                        <div className="relative">
                            <pre className="text-xs bg-black/40 text-white p-3 rounded-lg border border-white/10 overflow-auto font-mono">
                                <code><HighlightedCode code={fullCode} lang="js" /></code>
                            </pre>
                            <CopyButton text={fullCode} />
                        </div>
                    </div>

                    {/* JSON Config (collapsible) */}
                    <details className="group">
                        <summary className="text-sm font-semibold uppercase tracking-widest text-white/50 cursor-pointer select-none hover:text-white/70 transition-colors list-none flex items-center gap-2">
                            <span className="text-xs transition-transform group-open:rotate-90">▶</span>
                            JSON Config
                        </summary>
                        <div className="relative mt-2">
                            <pre className="text-xs bg-black/40 text-white p-3 rounded-lg border border-white/10 overflow-auto font-mono">
                                <code><HighlightedCode code={configStr} lang="json" /></code>
                            </pre>
                            <CopyButton text={configStr} />
                        </div>
                    </details>

                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onOpenChange(false)} className="text-xs px-3 py-1">Close</Button>
            </DialogActions>
        </Dialog>
    );
}
