import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Showcase surfaces mirror the live WebGL canvas into arbitrary boxes of the
 * page. We deliberately avoid spinning up one `NeatGradient` per mockup: a
 * browser only grants a handful of WebGL contexts, and every extra instance
 * would run its own shader. Instead every surface is a plain 2D canvas that
 * blits a crop of the single fullscreen canvas each frame, which keeps all
 * mockups perfectly in sync and costs a GPU-accelerated copy.
 *
 * The source canvas is created with `preserveDrawingBuffer: true`, so reading
 * from it outside of its own render callback is safe.
 */

export type SourceRef = React.MutableRefObject<HTMLCanvasElement | null>;

type Surface = {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    source: SourceRef;
    cx: number;
    cy: number;
    zoom: number;
    maxWidth?: number;
    cssWidth: number;
    cssHeight: number;
};

const surfaces = new Set<Surface>();
let rafId: number | null = null;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function drawSurface(s: Surface) {
    const src = s.source.current;
    const ctx = s.ctx;
    if (!src || !ctx) return;

    const sw = src.width;
    const sh = src.height;
    if (!sw || !sh || !s.cssWidth || !s.cssHeight) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = Math.max(1, Math.round(s.cssWidth * dpr));
    let h = Math.max(1, Math.round(s.cssHeight * dpr));
    if (s.maxWidth && w > s.maxWidth) {
        h = Math.max(1, Math.round(h * (s.maxWidth / w)));
        w = s.maxWidth;
    }
    if (s.canvas.width !== w || s.canvas.height !== h) {
        s.canvas.width = w;
        s.canvas.height = h;
    }

    // Largest crop of the source matching this surface's aspect ratio ("cover"),
    // then tightened by `zoom` and centred on (cx, cy).
    const aspect = w / h;
    let cw = sw;
    let ch = sw / aspect;
    if (ch > sh) {
        ch = sh;
        cw = sh * aspect;
    }
    const zoom = Math.max(1, s.zoom);
    cw /= zoom;
    ch /= zoom;

    const sx = clamp(s.cx * sw - cw / 2, 0, sw - cw);
    const sy = clamp(s.cy * sh - ch / 2, 0, sh - ch);

    try {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(src, sx, sy, cw, ch, 0, 0, w, h);
    } catch (e) {
        // Source context lost mid-frame — skip, it will recover on the next one.
    }
}

function tick() {
    rafId = requestAnimationFrame(tick);
    surfaces.forEach(drawSurface);
}

export type GradientSurfaceProps = {
    source: SourceRef;
    /** Horizontal centre of the crop, 0–1. */
    cx?: number;
    /** Vertical centre of the crop, 0–1. */
    cy?: number;
    /** Magnification. 1 shows as much of the gradient as fits, 2 shows half. */
    zoom?: number;
    /** Cap the backing store width in device pixels (used for cheap blurred fills). */
    maxWidth?: number;
    className?: string;
    style?: React.CSSProperties;
};

export function GradientSurface({
                                    source,
                                    cx = 0.5,
                                    cy = 0.5,
                                    zoom = 1,
                                    maxWidth,
                                    className,
                                    style
                                }: GradientSurfaceProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const surface: Surface = {
            canvas,
            ctx: canvas.getContext("2d"),
            source,
            cx,
            cy,
            zoom,
            maxWidth,
            cssWidth: canvas.clientWidth,
            cssHeight: canvas.clientHeight
        };

        surfaces.add(surface);
        drawSurface(surface);
        if (rafId === null) rafId = requestAnimationFrame(tick);

        const observer = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect;
            surface.cssWidth = rect.width;
            surface.cssHeight = rect.height;
        });
        observer.observe(canvas);

        return () => {
            observer.disconnect();
            surfaces.delete(surface);
            if (surfaces.size === 0 && rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        };
    }, [source, cx, cy, zoom, maxWidth]);

    return <canvas ref={canvasRef} className={"block w-full h-full " + (className ?? "")} style={style}/>;
}

/** Scenes drop to a single-column composition below this width. */
export function useIsNarrow(breakpoint = 720) {
    const [narrow, setNarrow] = useState(
        () => typeof window !== "undefined" && window.innerWidth < breakpoint
    );
    useEffect(() => {
        const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const update = () => setNarrow(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, [breakpoint]);
    return narrow;
}

/**
 * Mockups are composed at a fixed design size and scaled to fit, so their
 * proportions never break down — a hand-tuned layout beats a responsive one
 * when the whole point is showing off a composition.
 */
export function Stage({
                          designWidth,
                          designHeight,
                          maxScale = 1.15,
                          children
                      }: {
    designWidth: number;
    designHeight: number;
    maxScale?: number;
    children: React.ReactNode;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(0);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const update = () => {
            const pad = el.clientWidth < 720 ? 12 : 28;
            const available = Math.max(1, el.clientWidth - pad * 2);
            const availableHeight = Math.max(1, el.clientHeight - pad * 2);
            setScale(Math.min(maxScale, available / designWidth, availableHeight / designHeight));
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [designWidth, designHeight, maxScale]);

    return (
        <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
            <div
                className="shrink-0 transition-opacity duration-500"
                style={{
                    width: designWidth,
                    height: designHeight,
                    transform: `scale(${scale})`,
                    opacity: scale ? 1 : 0
                }}
            >
                {children}
            </div>
        </div>
    );
}
