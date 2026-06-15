/**
 * Canvas export utilities for the Neat editor.
 * Standalone functions for downloading PNG snapshots and recording video.
 */

function downloadURI(uri: string, name: string) {
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Downloads the current frame of a canvas element as a PNG image.
 */
export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename = "neat.png") {
    const dataURL = canvas.toDataURL("image/png");
    downloadURI(dataURL, filename);
}

/**
 * Records the canvas animation and saves it as a high-quality video file
 * (MP4 or WebM depending on browser codec support) with a subtle watermark.
 * Returns a `stop` function to end recording early.
 *
 * @param canvas      The source canvas element to record.
 * @param options     Recording configuration.
 * @returns A stop function to end recording early.
 */
export function recordCanvasVideo(
    canvas: HTMLCanvasElement,
    options: {
        durationMs?: number;
        filename?: string;
        width?: number;
        height?: number;
        format?: 'mp4' | 'webm';
        onProgress?: (progress: number) => void;
        onComplete?: () => void;
    } = {}
): () => void {
    const {
        durationMs = 5000,
        filename = "neat.firecms.co",
        format,
        onProgress,
        onComplete,
    } = options;

    const source = canvas;
    const width = options.width || source.width || source.clientWidth;
    const height = options.height || source.height || source.clientHeight;

    // Offscreen canvas that composites gradient + watermark each frame
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext("2d")!;

    // Use captureStream(0) — only captures a frame when we explicitly
    // call requestFrame() on the video track, so every composited frame
    // is guaranteed to be captured.
    const stream = offscreen.captureStream(0);
    const videoTrack = stream.getVideoTracks()[0];

    // Codec candidates ordered by preference
    const mp4Candidates = [
        "video/mp4;codecs=avc1",
        "video/mp4;codecs=avc1,opus",
        "video/mp4",
    ];
    const webmCandidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8,opus",
        "video/webm",
    ];

    // Build candidate list based on preferred format
    let candidates: string[];
    if (format === 'mp4') candidates = [...mp4Candidates, ...webmCandidates];
    else if (format === 'webm') candidates = [...webmCandidates, ...mp4Candidates];
    else candidates = [...mp4Candidates, ...webmCandidates];

    let mimeType = "video/webm";
    for (const candidate of candidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
            mimeType = candidate;
            break;
        }
    }

    // Scale bitrate with pixel count: 8 Mbps baseline at 720p
    const pixels = width * height;
    const baseBitrate = 8_000_000;
    const basePixels = 1280 * 720;
    const videoBitsPerSecond = Math.round(baseBitrate * Math.max(1, pixels / basePixels));

    const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    let stopped = false;
    let rafId: number;
    const startTime = performance.now();
    let lastProgressTime = 0;

    // Composite loop: draw source canvas + watermark overlay on each frame
    const drawFrame = () => {
        if (stopped) return;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(source, 0, 0, width, height);

        // Watermark: "NEAT" in bottom-right corner
        const fontSize = Math.max(14, Math.round(height * 0.025));
        ctx.font = `bold ${fontSize}px "Sofia Sans", sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("NEAT", width - fontSize * 0.8, height - fontSize * 0.5);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Signal the stream to capture this frame
        // @ts-ignore – requestFrame exists on CanvasCaptureMediaStreamTrack
        if (videoTrack.requestFrame) videoTrack.requestFrame();

        // Throttle progress to ~4 updates/sec to avoid flooding React state
        if (onProgress) {
            const now = performance.now();
            if (now - lastProgressTime > 250) {
                lastProgressTime = now;
                onProgress(Math.min(0.99, (now - startTime) / durationMs));
            }
        }

        rafId = requestAnimationFrame(drawFrame);
    };

    recorder.onstop = () => {
        stopped = true;
        cancelAnimationFrame(rafId);

        // Use the correct file extension for the actual format
        const isMP4 = mimeType.startsWith("video/mp4");
        const ext = isMP4 ? ".mp4" : ".webm";
        const blobType = isMP4 ? "video/mp4" : "video/webm";
        const finalFilename = filename + ext;

        const blob = new Blob(chunks, { type: blobType });
        const url = URL.createObjectURL(blob);
        downloadURI(url, finalFilename);
        setTimeout(() => URL.revokeObjectURL(url), 30000);

        onProgress?.(1);
        onComplete?.();
    };

    // Start drawing frames, then start recording
    drawFrame();
    recorder.start(100); // collect data every 100ms

    // Auto-stop after the requested duration
    const timeoutId = window.setTimeout(() => {
        if (recorder.state === "recording") {
            recorder.stop();
        }
    }, durationMs);

    // Return a stop function for early termination
    return () => {
        clearTimeout(timeoutId);
        if (recorder.state === "recording") {
            recorder.stop();
        }
    };
}
