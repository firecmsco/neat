import React, { useCallback, useEffect, useRef } from "react";
import "@fontsource/sofia-sans";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { IconButton } from "./ui/icon-button";
import { Label } from "./ui/label";
import { Select, SelectItem } from "./ui/select";
import { Sheet } from "./ui/sheet";
import { Slider } from "./ui/slider";
import { Tooltip } from "./ui/tooltip";
import { ChevronLeft, ChevronRight, Download, Import, Video, Square } from "lucide-react";
import { ColorSwatch } from "./ColorSwatch";
import { fontMap, NEAT_PRESET, PRESETS } from "./presets";
import { getComplementaryColor, isDarkColor } from "../utils/colors";
import { GetCodeDialog } from "./GetCodeDialog";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "./ui/dialog";
import { Analytics } from "@firebase/analytics";
import { logEvent } from "firebase/analytics";
import { NeatColor, NeatConfig, NeatGradient } from "@firecms/neat"; // Ensure this matches your local link
import { ImportConfigDialog } from "./ImportConfigDialog";

const defaultConfig: NeatConfig = NEAT_PRESET as NeatConfig;

export type NeatEditorProps = {
    analytics: Analytics;
};

const TWEEN_DURATION = 400; // ms

export default function NeatEditor({ analytics }: NeatEditorProps) {
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
    const [importDialogOpen, setImportDialogOpen] = React.useState(false);
    const [recordDialogOpen, setRecordDialogOpen] = React.useState(false);
    const [isRecording, setIsRecording] = React.useState<boolean>(false);
    const [recordingProgress, setRecordingProgress] = React.useState<number>(0);
    const [recordDuration, setRecordDuration] = React.useState<number>(5);
    const [recordResolution, setRecordResolution] = React.useState<string>("current");
    const stopRecordingRef = React.useRef<(() => void) | null>(null);

    // Global UI visibility
    const [uiVisible, setUiVisible] = React.useState<boolean>(true);

    const editorContainerRef = React.useRef<HTMLDivElement | null>(null);
    const scrollContentRef = React.useRef<HTMLDivElement | null>(null);

    const handleDrawerClose = () => setDrawerOpen(false);

    const handleConfigImport = (importedConfig: NeatConfig) => {
        updatePresetConfig(importedConfig);
    };

    // Track if we're closing via back button to avoid double history manipulation
    const closingViaBackButton = useRef(false);

    // Mobile back button handling - close dialogs instead of leaving site
    useEffect(() => {
        const handlePopState = () => {
            // Check if any dialog/drawer is open and close it
            if (drawerOpen || dialogOpen || importDialogOpen || recordDialogOpen) {
                closingViaBackButton.current = true;
                if (drawerOpen) setDrawerOpen(false);
                if (dialogOpen) setDialogOpen(false);
                if (importDialogOpen) setImportDialogOpen(false);
                if (recordDialogOpen && !isRecording) setRecordDialogOpen(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [drawerOpen, dialogOpen, importDialogOpen, recordDialogOpen, isRecording]);

    // Push history state when opening dialogs/drawer
    useEffect(() => {
        if (drawerOpen || dialogOpen || importDialogOpen || recordDialogOpen) {
            // Push a new history state when opening
            window.history.pushState({ modal: true }, '');
        } else if (!closingViaBackButton.current) {
            // If closing normally (not via back button), go back in history
            // This prevents leaving an empty state in history
            if (window.history.state?.modal) {
                window.history.back();
            }
        }
        // Reset flag
        closingViaBackButton.current = false;
    }, [drawerOpen, dialogOpen, importDialogOpen, recordDialogOpen]);

    const updatePresetConfig = (config: NeatConfig) => {
        setColors(config.colors);
        if (config.wireframe !== undefined) setWireframe(config.wireframe);
        if (config.speed !== undefined) setSpeed(config.speed);
        if (config.colorBlending !== undefined) setColorBlending(config.colorBlending);
        if (config.horizontalPressure !== undefined) setHorizontalPressure(config.horizontalPressure);
        if (config.verticalPressure !== undefined) setVerticalPressure(config.verticalPressure);
        if (config.shadows !== undefined) setShadows(config.shadows);
        if (config.highlights !== undefined) setHighlights(config.highlights);
        if (config.colorSaturation !== undefined) setSaturation(config.colorSaturation);
        if (config.colorBrightness !== undefined) setBrightness(config.colorBrightness);
        if (config.waveFrequencyX !== undefined) setWaveFrequencyX(config.waveFrequencyX);
        if (config.waveFrequencyY !== undefined) setWaveFrequencyY(config.waveFrequencyY);
        if (config.waveAmplitude !== undefined) setWaveAmplitude(config.waveAmplitude);
        if (config.backgroundAlpha !== undefined) setBackgroundAlpha(config.backgroundAlpha);
        if (config.backgroundColor !== undefined) setBackgroundColor(config.backgroundColor);
        if (config.resolution !== undefined) setResolution(config.resolution);
        if (config.grainIntensity !== undefined) setGrainIntensity(config.grainIntensity);
        if (config.grainSparsity !== undefined) setGrainSparsity(config.grainSparsity);
        if (config.grainSpeed !== undefined) setGrainSpeed(config.grainSpeed);
        if (config.grainScale !== undefined) setGrainScale(config.grainScale);
        if (config.yOffsetWaveMultiplier !== undefined) setYOffsetWaveMultiplier(config.yOffsetWaveMultiplier);
        if (config.yOffsetColorMultiplier !== undefined) setYOffsetColorMultiplier(config.yOffsetColorMultiplier);
        if (config.yOffsetFlowMultiplier !== undefined) setYOffsetFlowMultiplier(config.yOffsetFlowMultiplier);

        // Flow field
        if (config.flowDistortionA !== undefined) setFlowDistortionA(config.flowDistortionA);
        if (config.flowDistortionB !== undefined) setFlowDistortionB(config.flowDistortionB);
        if (config.flowScale !== undefined) setFlowScale(config.flowScale);
        if (config.flowEase !== undefined) setFlowEase(config.flowEase);
        if (config.flowEnabled !== undefined) setFlowEnabled(config.flowEnabled);



        // Texture generation
        if (config.enableProceduralTexture !== undefined) setEnableProceduralTexture(config.enableProceduralTexture);
        if (config.textureVoidLikelihood !== undefined) setTextureVoidLikelihood(config.textureVoidLikelihood);
        if (config.textureVoidWidthMin !== undefined) setTextureVoidWidthMin(config.textureVoidWidthMin);
        if (config.textureVoidWidthMax !== undefined) setTextureVoidWidthMax(config.textureVoidWidthMax);
        if (config.textureBandDensity !== undefined) setTextureBandDensity(config.textureBandDensity);
        if (config.textureColorBlending !== undefined) setTextureColorBlending(config.textureColorBlending);
        if (config.textureSeed !== undefined) setTextureSeed(config.textureSeed);
        if (config.textureEase !== undefined) setTextureEase(config.textureEase);
        if (config.proceduralBackgroundColor !== undefined) setProceduralBackgroundColor(config.proceduralBackgroundColor);
        setTextureShapeTriangles(config.textureShapeTriangles ?? 20);
        setTextureShapeCircles(config.textureShapeCircles ?? 15);
        setTextureShapeBars(config.textureShapeBars ?? 15);
        setTextureShapeSquiggles(config.textureShapeSquiggles ?? 10);

        // New effects — reset to defaults when not specified
        setDomainWarpEnabled(config.domainWarpEnabled ?? false);
        setDomainWarpIntensity(config.domainWarpIntensity ?? 0);
        setDomainWarpScale(config.domainWarpScale ?? 3.0);
        setVignetteIntensity(config.vignetteIntensity ?? 0);
        setVignetteRadius(config.vignetteRadius ?? 0.8);
        setFresnelEnabled(config.fresnelEnabled ?? false);
        setFresnelPower(config.fresnelPower ?? 2.0);
        setFresnelIntensity(config.fresnelIntensity ?? 0.5);
        setFresnelColor(config.fresnelColor ?? '#FFFFFF');

        setIridescenceEnabled(config.iridescenceEnabled ?? false);
        setIridescenceIntensity(config.iridescenceIntensity ?? 0.5);
        setIridescenceSpeed(config.iridescenceSpeed ?? 1);
        setBloomIntensity(config.bloomIntensity ?? 0);
        setBloomThreshold(config.bloomThreshold ?? 0.7);
        setChromaticAberration(config.chromaticAberration ?? 0);
    }

    const [selectedPresetIndex, setSelectedPresetIndex] = React.useState<number>(0);
    const [colors, setColors] = React.useState<NeatColor[]>(defaultConfig.colors ?? []);
    const [wireframe, setWireframe] = React.useState<boolean>(defaultConfig.wireframe ?? false);
    const [speed, setSpeed] = React.useState<number>(defaultConfig.speed ?? 4);
    const [colorBlending, setColorBlending] = React.useState<number>(defaultConfig.colorBlending ?? 5);
    const [horizontalPressure, setHorizontalPressure] = React.useState<number>(defaultConfig.horizontalPressure ?? 3);
    const [verticalPressure, setVerticalPressure] = React.useState<number>(defaultConfig.verticalPressure ?? 3);
    const [shadows, setShadows] = React.useState<number>(defaultConfig.shadows ?? 4);
    const [highlights, setHighlights] = React.useState<number>(defaultConfig.highlights ?? 4);
    const [saturation, setSaturation] = React.useState<number>(defaultConfig.colorSaturation ?? 0);
    const [brightness, setBrightness] = React.useState<number>(defaultConfig.colorBrightness ?? 1);
    const [waveFrequencyX, setWaveFrequencyX] = React.useState<number>(defaultConfig.waveFrequencyX ?? 5);
    const [waveFrequencyY, setWaveFrequencyY] = React.useState<number>(defaultConfig.waveFrequencyY ?? 5);
    const [waveAmplitude, setWaveAmplitude] = React.useState<number>(defaultConfig.waveAmplitude ?? 3);
    const [resolution, setResolution] = React.useState<number>(defaultConfig.resolution ?? 1);
    const [backgroundAlpha, setBackgroundAlpha] = React.useState<number>(defaultConfig.backgroundAlpha ?? 1);
    const [backgroundColor, setBackgroundColor] = React.useState<string>(defaultConfig.backgroundColor ?? "#000000");
    const [grainIntensity, setGrainIntensity] = React.useState<number>(defaultConfig.grainIntensity ?? 0.55);
    const [grainSparsity, setGrainSparsity] = React.useState<number>(defaultConfig.grainSparsity ?? 0);
    const [grainScale, setGrainScale] = React.useState<number>(defaultConfig.grainScale ?? 2);
    const [grainSpeed, setGrainSpeed] = React.useState<number>(defaultConfig.grainSpeed ?? 0.1);

    // yOffset state - NO LONGER TWEENED
    const [yOffset, setYOffset] = React.useState<number>(0);
    const [yOffsetWaveMultiplier, setYOffsetWaveMultiplier] = React.useState<number>(defaultConfig.yOffsetWaveMultiplier ?? 4);
    const [yOffsetColorMultiplier, setYOffsetColorMultiplier] = React.useState<number>(defaultConfig.yOffsetColorMultiplier ?? 4);
    const [yOffsetFlowMultiplier, setYOffsetFlowMultiplier] = React.useState<number>(defaultConfig.yOffsetFlowMultiplier ?? 4);

    // Flow field parameters
    const [flowDistortionA, setFlowDistortionA] = React.useState<number>(defaultConfig.flowDistortionA ?? 0);
    const [flowDistortionB, setFlowDistortionB] = React.useState<number>(defaultConfig.flowDistortionB ?? 0);
    const [flowScale, setFlowScale] = React.useState<number>(defaultConfig.flowScale ?? 1.0);
    const [flowEase, setFlowEase] = React.useState<number>(defaultConfig.flowEase ?? 0.0);
    const [flowEnabled, setFlowEnabled] = React.useState<boolean>(defaultConfig.flowEnabled ?? true);



    // Texture generation parameters
    const [enableProceduralTexture, setEnableProceduralTexture] = React.useState<boolean>(defaultConfig.enableProceduralTexture ?? false);
    const [textureVoidLikelihood, setTextureVoidLikelihood] = React.useState<number>(defaultConfig.textureVoidLikelihood ?? 0.45);
    const [textureVoidWidthMin, setTextureVoidWidthMin] = React.useState<number>(defaultConfig.textureVoidWidthMin ?? 200);
    const [textureVoidWidthMax, setTextureVoidWidthMax] = React.useState<number>(defaultConfig.textureVoidWidthMax ?? 486);
    const [textureBandDensity, setTextureBandDensity] = React.useState<number>(defaultConfig.textureBandDensity ?? 2.15);
    const [textureColorBlending, setTextureColorBlending] = React.useState<number>(defaultConfig.textureColorBlending ?? 0.01);
    const [textureSeed, setTextureSeed] = React.useState<number>(defaultConfig.textureSeed ?? 333);
    const [textureEase, setTextureEase] = React.useState<number>(defaultConfig.textureEase ?? 0.5);
    const [proceduralBackgroundColor, setProceduralBackgroundColor] = React.useState<string>(defaultConfig.proceduralBackgroundColor ?? "#000000");
    const [textureShapeTriangles, setTextureShapeTriangles] = React.useState<number>(defaultConfig.textureShapeTriangles ?? 20);
    const [textureShapeCircles, setTextureShapeCircles] = React.useState<number>(defaultConfig.textureShapeCircles ?? 15);
    const [textureShapeBars, setTextureShapeBars] = React.useState<number>(defaultConfig.textureShapeBars ?? 15);
    const [textureShapeSquiggles, setTextureShapeSquiggles] = React.useState<number>(defaultConfig.textureShapeSquiggles ?? 10);

    // === New effect state ===
    const [domainWarpEnabled, setDomainWarpEnabled] = React.useState<boolean>(defaultConfig.domainWarpEnabled ?? false);
    const [domainWarpIntensity, setDomainWarpIntensity] = React.useState<number>(defaultConfig.domainWarpIntensity ?? 0);
    const [domainWarpScale, setDomainWarpScale] = React.useState<number>(defaultConfig.domainWarpScale ?? 3.0);
    const [vignetteIntensity, setVignetteIntensity] = React.useState<number>(defaultConfig.vignetteIntensity ?? 0);
    const [vignetteRadius, setVignetteRadius] = React.useState<number>(defaultConfig.vignetteRadius ?? 0.8);
    const [fresnelEnabled, setFresnelEnabled] = React.useState<boolean>(defaultConfig.fresnelEnabled ?? false);
    const [fresnelPower, setFresnelPower] = React.useState<number>(defaultConfig.fresnelPower ?? 2.0);
    const [fresnelIntensity, setFresnelIntensity] = React.useState<number>(defaultConfig.fresnelIntensity ?? 0.5);
    const [fresnelColor, setFresnelColor] = React.useState<string>(defaultConfig.fresnelColor ?? '#FFFFFF');

    const [iridescenceEnabled, setIridescenceEnabled] = React.useState<boolean>(defaultConfig.iridescenceEnabled ?? false);
    const [iridescenceIntensity, setIridescenceIntensity] = React.useState<number>(defaultConfig.iridescenceIntensity ?? 0.5);
    const [iridescenceSpeed, setIridescenceSpeed] = React.useState<number>(defaultConfig.iridescenceSpeed ?? 1);
    const [bloomIntensity, setBloomIntensity] = React.useState<number>(defaultConfig.bloomIntensity ?? 0);
    const [bloomThreshold, setBloomThreshold] = React.useState<number>(defaultConfig.bloomThreshold ?? 0.7);
    const [chromaticAberration, setChromaticAberration] = React.useState<number>(defaultConfig.chromaticAberration ?? 0);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gradientRef = useRef<NeatGradient>();

    type TweenState = {
        speed: number;
        horizontalPressure: number;
        verticalPressure: number;
        waveFrequencyX: number;
        waveFrequencyY: number;
        waveAmplitude: number;
        shadows: number;
        highlights: number;
        saturation: number;
        brightness: number;
        colorBlending: number;
        resolution: number;
        backgroundAlpha: number;
        grainIntensity: number;
        grainSparsity: number;
        grainScale: number;
        grainSpeed: number;
        // yOffset REMOVED FROM TWEEN
        flowDistortionA: number;
        flowDistortionB: number;
        flowScale: number;
        flowEase: number;
    };

    const [tweened, setTweened] = React.useState<TweenState>(() => ({
        speed: defaultConfig.speed ?? 4,
        horizontalPressure: defaultConfig.horizontalPressure ?? 3,
        verticalPressure: defaultConfig.verticalPressure ?? 3,
        waveFrequencyX: defaultConfig.waveFrequencyX ?? 5,
        waveFrequencyY: defaultConfig.waveFrequencyY ?? 5,
        waveAmplitude: defaultConfig.waveAmplitude ?? 3,
        shadows: defaultConfig.shadows ?? 4,
        highlights: defaultConfig.highlights ?? 4,
        saturation: defaultConfig.colorSaturation ?? 0,
        brightness: defaultConfig.colorBrightness ?? 1,
        colorBlending: defaultConfig.colorBlending ?? 5,
        resolution: defaultConfig.resolution ?? 1,
        backgroundAlpha: defaultConfig.backgroundAlpha ?? 1,
        grainIntensity: defaultConfig.grainIntensity ?? 0.55,
        grainSparsity: defaultConfig.grainSparsity ?? 0,
        grainScale: defaultConfig.grainScale ?? 2,
        grainSpeed: defaultConfig.grainSpeed ?? 0.1,
        // yOffset REMOVED
        flowDistortionA: defaultConfig.flowDistortionA ?? 0,
        flowDistortionB: defaultConfig.flowDistortionB ?? 0,
        flowScale: defaultConfig.flowScale ?? 1.0,
        flowEase: defaultConfig.flowEase ?? 0.0,
    }));

    const tweenStartRef = React.useRef<number | null>(null);
    const tweenFromRef = React.useRef<TweenState | null>(null);
    const tweenToRef = React.useRef<TweenState | null>(null);
    const tweenRafRef = React.useRef<number | null>(null);

    // Scroll Handler - Infinite scroll with position reset
    const lastScrollTop = useRef(0);

    useEffect(() => {
        const scrollContainer = scrollContentRef.current;
        if (!scrollContainer) return;

        // Initialize scroll position to middle
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
        const middleScroll = (scrollHeight - clientHeight) / 2;
        scrollContainer.scrollTop = middleScroll;
        lastScrollTop.current = middleScroll;

        const handleScroll = () => {
            const scrollTop = scrollContainer.scrollTop;
            const scrollHeight = scrollContainer.scrollHeight;
            const clientHeight = scrollContainer.clientHeight;
            const maxScroll = scrollHeight - clientHeight;

            // Calculate scroll delta
            const delta = scrollTop - lastScrollTop.current;

            // Accumulate yOffset infinitely
            setYOffset(prev => prev + delta);

            // Reset scroll position when near edges (infinite scroll effect)
            const threshold = maxScroll * 0.1; // 10% from edges
            if (scrollTop < threshold) {
                // Near top, jump to middle
                scrollContainer.scrollTop = middleScroll;
                lastScrollTop.current = middleScroll;
            } else if (scrollTop > maxScroll - threshold) {
                // Near bottom, jump to middle
                scrollContainer.scrollTop = middleScroll;
                lastScrollTop.current = middleScroll;
            } else {
                lastScrollTop.current = scrollTop;
            }
        };

        scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            scrollContainer.removeEventListener("scroll", handleScroll);
        };
    }, []);

    // 1. TWEEN LOOP (Performance Heavy) - Removed yOffset
    useEffect(() => {
        const target: TweenState = {
            speed, horizontalPressure, verticalPressure, waveFrequencyX, waveFrequencyY, waveAmplitude,
            shadows, highlights, saturation, brightness, colorBlending, resolution, backgroundAlpha,
            grainIntensity, grainSparsity, grainScale, grainSpeed,
            // yOffset REMOVED
            flowDistortionA, flowDistortionB, flowScale, flowEase,
        };

        const start = performance.now();
        tweenStartRef.current = start;
        tweenFromRef.current = tweened;
        tweenToRef.current = target;

        const step = (now: number) => {
            const t0 = tweenStartRef.current;
            const from = tweenFromRef.current;
            const to = tweenToRef.current;
            if (t0 == null || !from || !to) return;
            const elapsed = now - t0;
            const alpha = Math.min(1, elapsed / TWEEN_DURATION);
            const eased = alpha * (2 - alpha);

            const next: typeof tweened = { ...from };
            (Object.keys(from) as (keyof typeof from)[]).forEach((key) => {
                const fv = from[key] as number;
                const tv = to[key] as number;
                next[key] = fv + (tv - fv) * eased as any;
            });
            setTweened(next);

            if (alpha < 1) {
                tweenRafRef.current = requestAnimationFrame(step);
            }
        };

        if (tweenRafRef.current != null) cancelAnimationFrame(tweenRafRef.current);
        tweenRafRef.current = requestAnimationFrame(step);

        return () => {
            if (tweenRafRef.current != null) cancelAnimationFrame(tweenRafRef.current);
        };
    }, [
        speed, horizontalPressure, verticalPressure, waveFrequencyX, waveFrequencyY, waveAmplitude,
        shadows, highlights, saturation, brightness, colorBlending, resolution, backgroundAlpha,
        grainIntensity, grainSparsity, grainScale, grainSpeed,
        // yOffset REMOVED
        flowDistortionA, flowDistortionB, flowScale, flowEase,
    ]);

    // 2. IMMEDIATE SCROLL UPDATE (New Effect)
    // This updates the gradient instantly without tweening lag
    useEffect(() => {
        if (gradientRef.current) {
            gradientRef.current.yOffset = yOffset;
        }
    }, [yOffset]);

    useEffect(() => {
        if (gradientRef.current) {
            gradientRef.current.yOffsetWaveMultiplier = yOffsetWaveMultiplier;
        }
    }, [yOffsetWaveMultiplier]);

    useEffect(() => {
        if (gradientRef.current) {
            gradientRef.current.yOffsetColorMultiplier = yOffsetColorMultiplier;
        }
    }, [yOffsetColorMultiplier]);

    useEffect(() => {
        if (gradientRef.current) {
            gradientRef.current.yOffsetFlowMultiplier = yOffsetFlowMultiplier;
        }
    }, [yOffsetFlowMultiplier]);

    // Init Gradient
    useEffect(() => {
        if (!canvasRef.current) return;

        gradientRef.current = new NeatGradient({
            ref: canvasRef.current,
            colors,
            speed: tweened.speed,
            horizontalPressure: tweened.horizontalPressure,
            verticalPressure: tweened.verticalPressure,
            waveFrequencyX: tweened.waveFrequencyX,
            waveFrequencyY: tweened.waveFrequencyY,
            waveAmplitude: tweened.waveAmplitude,
            wireframe,
            colorBlending: tweened.colorBlending,
            shadows: tweened.shadows,
            highlights: tweened.highlights,
            colorSaturation: tweened.saturation,
            colorBrightness: tweened.brightness,
            grainSpeed: tweened.grainSpeed,
            grainIntensity: tweened.grainIntensity,
            grainSparsity: tweened.grainSparsity,
            grainScale: tweened.grainScale,
            resolution: tweened.resolution,
            yOffset: yOffset, // Pass raw yOffset
            yOffsetWaveMultiplier,
            yOffsetColorMultiplier,
            yOffsetFlowMultiplier,
            flowDistortionA: tweened.flowDistortionA,
            flowDistortionB: tweened.flowDistortionB,
            flowScale: tweened.flowScale,
            flowEase: tweened.flowEase,
            flowEnabled,

            enableProceduralTexture,
            textureVoidLikelihood,
            textureVoidWidthMin,
            textureVoidWidthMax,
            textureBandDensity,
            textureColorBlending,
            textureSeed,
            textureEase,
            proceduralBackgroundColor,
            textureShapeTriangles,
            textureShapeCircles,
            textureShapeBars,
            textureShapeSquiggles,

            // New effects
            domainWarpEnabled,
            domainWarpIntensity,
            domainWarpScale,
            vignetteIntensity,
            vignetteRadius,
            fresnelEnabled,
            fresnelPower,
            fresnelIntensity,
            fresnelColor,

            iridescenceEnabled,
            iridescenceIntensity,
            iridescenceSpeed,
            bloomIntensity,
            bloomThreshold,
            chromaticAberration,
        });
        return gradientRef.current.destroy;
    }, []);

    // Update Gradient properties
    useEffect(() => {
        if (!gradientRef.current) return;
        // Don't update yOffset here - handled by specific effect above
        gradientRef.current.colors = colors;
        gradientRef.current.speed = tweened.speed;
        gradientRef.current.horizontalPressure = tweened.horizontalPressure;
        gradientRef.current.verticalPressure = tweened.verticalPressure;
        gradientRef.current.waveFrequencyX = tweened.waveFrequencyX;
        gradientRef.current.waveFrequencyY = tweened.waveFrequencyY;
        gradientRef.current.waveAmplitude = tweened.waveAmplitude;
        gradientRef.current.shadows = tweened.shadows;
        gradientRef.current.highlights = tweened.highlights;
        gradientRef.current.colorSaturation = tweened.saturation;
        gradientRef.current.colorBrightness = tweened.brightness;
        gradientRef.current.wireframe = wireframe;
        gradientRef.current.colorBlending = tweened.colorBlending;
        gradientRef.current.backgroundColor = backgroundColor;
        gradientRef.current.backgroundAlpha = tweened.backgroundAlpha;
        gradientRef.current.grainIntensity = tweened.grainIntensity;
        gradientRef.current.grainSparsity = tweened.grainSparsity;
        gradientRef.current.grainScale = tweened.grainScale;
        gradientRef.current.grainSpeed = tweened.grainSpeed;
        gradientRef.current.resolution = tweened.resolution;
        gradientRef.current.flowDistortionA = tweened.flowDistortionA;
        gradientRef.current.flowDistortionB = tweened.flowDistortionB;
        gradientRef.current.flowScale = tweened.flowScale;
        gradientRef.current.flowEase = tweened.flowEase;
        gradientRef.current.flowEnabled = flowEnabled;

        gradientRef.current.enableProceduralTexture = enableProceduralTexture;
        gradientRef.current.textureVoidLikelihood = textureVoidLikelihood;
        gradientRef.current.textureVoidWidthMin = textureVoidWidthMin;
        gradientRef.current.textureVoidWidthMax = textureVoidWidthMax;
        gradientRef.current.textureBandDensity = textureBandDensity;
        gradientRef.current.textureColorBlending = textureColorBlending;
        gradientRef.current.textureSeed = textureSeed;
        gradientRef.current.textureEase = textureEase;
        gradientRef.current.proceduralBackgroundColor = proceduralBackgroundColor;
        // @ts-ignore
        gradientRef.current.textureShapeTriangles = textureShapeTriangles;
        // @ts-ignore
        gradientRef.current.textureShapeCircles = textureShapeCircles;
        // @ts-ignore
        gradientRef.current.textureShapeBars = textureShapeBars;
        // @ts-ignore
        gradientRef.current.textureShapeSquiggles = textureShapeSquiggles;

        // New effects
        gradientRef.current.domainWarpEnabled = domainWarpEnabled;
        gradientRef.current.domainWarpIntensity = domainWarpIntensity;
        gradientRef.current.domainWarpScale = domainWarpScale;
        gradientRef.current.vignetteIntensity = vignetteIntensity;
        gradientRef.current.vignetteRadius = vignetteRadius;
        gradientRef.current.fresnelEnabled = fresnelEnabled;
        gradientRef.current.fresnelPower = fresnelPower;
        gradientRef.current.fresnelIntensity = fresnelIntensity;
        gradientRef.current.fresnelColor = fresnelColor;

        gradientRef.current.iridescenceEnabled = iridescenceEnabled;
        gradientRef.current.iridescenceIntensity = iridescenceIntensity;
        gradientRef.current.iridescenceSpeed = iridescenceSpeed;
        gradientRef.current.bloomIntensity = bloomIntensity;
        gradientRef.current.bloomThreshold = bloomThreshold;
        gradientRef.current.chromaticAberration = chromaticAberration;
    }, [
        tweened,
        colors,
        backgroundColor,
        wireframe,
        // yOffset removed
        enableProceduralTexture,
        proceduralBackgroundColor,
        textureVoidLikelihood,
        textureVoidWidthMin,
        textureVoidWidthMax,
        textureBandDensity,
        textureColorBlending,
        textureSeed,
        textureEase,
        textureShapeTriangles,
        textureShapeCircles,
        textureShapeBars,
        textureShapeSquiggles,
        flowEnabled,
        // New effects
        domainWarpEnabled, domainWarpIntensity, domainWarpScale,
        vignetteIntensity, vignetteRadius,
        fresnelEnabled, fresnelPower, fresnelIntensity, fresnelColor,

        iridescenceEnabled, iridescenceIntensity, iridescenceSpeed,
        bloomIntensity, bloomThreshold,
        chromaticAberration,
    ]);

    const handleColorChange = (newValue: NeatColor, index: number) => {
        const newColors = [...colors];
        newColors[index] = newValue;
        setColors(newColors);
    };

    const onGetTheCodeClick = () => {
        setDialogOpen(true);
        logEvent(analytics, 'open_get_code_dialog', { config });
    };

    const handleStartRecording = useCallback(() => {
        if (!gradientRef.current || isRecording) return;
        setIsRecording(true);
        setRecordingProgress(0);
        logEvent(analytics, 'record_video', { duration: recordDuration, resolution: recordResolution });

        // Determine target dimensions
        const canvas = gradientRef.current;
        let width: number | undefined;
        let height: number | undefined;
        if (recordResolution === '720p') { width = 1280; height = 720; }
        else if (recordResolution === '1080p') { width = 1920; height = 1080; }
        else if (recordResolution === '4k') { width = 3840; height = 2160; }
        // 'current' → undefined, uses canvas size

        const stop = canvas.recordVideo({
            durationMs: recordDuration * 1000,
            filename: 'neat.firecms.co',
            width,
            height,
            onProgress: (p) => setRecordingProgress(p),
            onComplete: () => {
                setIsRecording(false);
                setRecordingProgress(0);
                stopRecordingRef.current = null;
            },
        });
        stopRecordingRef.current = stop;
    }, [analytics, recordDuration, recordResolution, isRecording]);

    const handleStopRecording = useCallback(() => {
        if (stopRecordingRef.current) {
            stopRecordingRef.current();
            stopRecordingRef.current = null;
        }
    }, []);

    const generateRandomConfig = () => {
        // Helper function to generate random number in range
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        // Helper function to generate random color
        const randomColor = () => {
            const hue = Math.floor(Math.random() * 360);
            const saturation = Math.floor(randomInRange(50, 100));
            const lightness = Math.floor(randomInRange(30, 70));
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        };

        // Generate 3-5 random colors
        const numColors = Math.floor(randomInRange(3, 6));
        const randomColors: NeatColor[] = Array.from({ length: numColors }, () => ({
            color: randomColor(),
            enabled: true
        }));

        // Apply random configuration
        setColors(randomColors);
        setWireframe(Math.random() < 0.2); // 20% chance of wireframe
        setSpeed(randomInRange(0, 8));
        setColorBlending(randomInRange(1, 10));
        setHorizontalPressure(randomInRange(0, 10));
        setVerticalPressure(randomInRange(0, 10));
        setShadows(randomInRange(0, 10));
        setHighlights(randomInRange(0, 10));
        setSaturation(randomInRange(-1, 1));
        setBrightness(randomInRange(0.5, 1.5));
        setWaveFrequencyX(randomInRange(0, 10));
        setWaveFrequencyY(randomInRange(0, 10));
        setWaveAmplitude(randomInRange(0, 10));
        setBackgroundAlpha(randomInRange(0.7, 1));
        setBackgroundColor(randomColor());
        setGrainIntensity(randomInRange(0, 1));
        setGrainSparsity(randomInRange(0, 1));
        setGrainScale(randomInRange(1, 4));
        setGrainSpeed(randomInRange(0, 0.5));

        // Flow field with 50% chance of being enabled
        const enableFlow = Math.random() < 0.5;
        setFlowEnabled(enableFlow);
        if (enableFlow) {
            setFlowDistortionA(randomInRange(0, 5));
            setFlowDistortionB(randomInRange(0, 10));
            setFlowScale(randomInRange(0, 5));
            setFlowEase(randomInRange(0, 1));
        }



        // Procedural texture with 20% chance of being enabled
        const enableTexture = Math.random() < 0.2;
        setEnableProceduralTexture(enableTexture);
        if (enableTexture) {
            setTextureVoidLikelihood(randomInRange(0.2, 0.7));
            setTextureVoidWidthMin(randomInRange(100, 300));
            setTextureVoidWidthMax(randomInRange(300, 600));
            setTextureBandDensity(randomInRange(1, 4));
            setTextureColorBlending(randomInRange(0, 0.1));
            setTextureSeed(Math.floor(randomInRange(1, 10000)));
            setProceduralBackgroundColor(randomColor());
            setTextureShapeTriangles(Math.floor(randomInRange(10, 30)));
            setTextureShapeCircles(Math.floor(randomInRange(10, 25)));
            setTextureShapeBars(Math.floor(randomInRange(10, 25)));
            setTextureShapeSquiggles(Math.floor(randomInRange(5, 20)));
        }

        logEvent(analytics, 'random_config_generated');
    };

    // We only need complementary color for the title now
    const [complementaryColor, setComplementaryColor] = React.useState<string | undefined>();
    useEffect(() => {
        setComplementaryColor(getComplementaryColor(colors[0].color));
    }, [colors]);

    // ── FPS counter ───────────────────────────────────────────────
    const [fps, setFps] = React.useState(0);
    const [fpsMin, setFpsMin] = React.useState<number>(Infinity);
    const [fpsMax, setFpsMax] = React.useState<number>(0);
    const fpsFrames = useRef(0);
    const fpsLastTime = useRef(performance.now());
    const fpsRafRef = useRef<number | null>(null);


    // FPS measurement loop
    useEffect(() => {
        const tick = () => {
            fpsFrames.current++;
            const now = performance.now();
            const elapsed = now - fpsLastTime.current;
            if (elapsed >= 500) { // update twice per second for smooth display
                const currentFps = Math.round((fpsFrames.current / elapsed) * 1000);
                setFps(currentFps);
                setFpsMin(prev => Math.min(prev, currentFps));
                setFpsMax(prev => Math.max(prev, currentFps));
                fpsFrames.current = 0;
                fpsLastTime.current = now;
            }
            fpsRafRef.current = requestAnimationFrame(tick);
        };
        fpsRafRef.current = requestAnimationFrame(tick);
        return () => {
            if (fpsRafRef.current != null) cancelAnimationFrame(fpsRafRef.current);
        };
    }, []);

    const config: NeatConfig = {
        colors,
        speed,
        horizontalPressure,
        verticalPressure,
        waveFrequencyX,
        waveFrequencyY,
        waveAmplitude,
        shadows,
        highlights,
        colorBrightness: brightness,
        colorSaturation: saturation,
        wireframe,
        colorBlending,
        backgroundColor,
        backgroundAlpha,
        grainScale,
        grainSparsity,
        grainIntensity,
        grainSpeed,
        resolution,
        yOffset,
        yOffsetWaveMultiplier,
        yOffsetColorMultiplier,
        yOffsetFlowMultiplier,
        // Flow field
        flowDistortionA,
        flowDistortionB,
        flowScale,
        flowEase,
        flowEnabled,

        // Texture generation
        enableProceduralTexture,
        textureVoidLikelihood,
        textureVoidWidthMin,
        textureVoidWidthMax,
        textureBandDensity,
        textureColorBlending,
        textureSeed,
        textureEase,
        proceduralBackgroundColor,
        textureShapeTriangles,
        textureShapeCircles,
        textureShapeBars,
        textureShapeSquiggles,

        // New effects
        domainWarpEnabled,
        domainWarpIntensity,
        domainWarpScale,
        vignetteIntensity,
        vignetteRadius,
        fresnelEnabled,
        fresnelPower,
        fresnelIntensity,
        fresnelColor,

        iridescenceEnabled,
        iridescenceIntensity,
        iridescenceSpeed,
        bloomIntensity,
        bloomThreshold,
        chromaticAberration,
    };

    // Reset FPS min/max whenever config changes
    const configKey = JSON.stringify(config);
    const prevConfigKeyRef = useRef(configKey);
    useEffect(() => {
        if (prevConfigKeyRef.current !== configKey) {
            prevConfigKeyRef.current = configKey;
            setFpsMin(Infinity);
            setFpsMax(0);
        }
    }, [configKey]);

    const selectedPreset = Object.keys(PRESETS)[selectedPresetIndex];

    function setPreset(preset: string) {
        setSelectedPresetIndex(Object.keys(PRESETS).indexOf(preset));
        updatePresetConfig(PRESETS[preset]);
    }

    const fontClass = fontMap[selectedPreset] || 'font-sans';

    const prevPreset = () => {
        setSelectedPresetIndex((selectedPresetIndex - 1 + Object.keys(PRESETS).length) % Object.keys(PRESETS).length);
        setPreset(Object.keys(PRESETS)[(selectedPresetIndex - 1 + Object.keys(PRESETS).length) % Object.keys(PRESETS).length]);
    };
    const nextPreset = () => {
        setSelectedPresetIndex((selectedPresetIndex + 1) % Object.keys(PRESETS).length);
        setPreset(Object.keys(PRESETS)[(selectedPresetIndex + 1) % Object.keys(PRESETS).length]);
    };

    // Keyboard shortcuts: arrows for presets, 'c' to toggle controls, 'h' to toggle UI
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") nextPreset();
            else if (event.key === "ArrowLeft") prevPreset();
            else if (event.key.toLowerCase() === 'c') setDrawerOpen((v) => !v);
            else if (event.key.toLowerCase() === 'h') setUiVisible((v) => !v);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPresetIndex]);

    // Touch swipe support for changing presets on mobile
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);

    useEffect(() => {
        const container = editorContainerRef.current;
        if (!container) return;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!e.changedTouches[0]) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX.current;
            const deltaY = touchEndY - touchStartY.current;

            // Only trigger if horizontal swipe is dominant (not vertical scroll)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    // Swipe right - previous preset
                    prevPreset();
                    logEvent(analytics, 'swipe_preset', { direction: 'right' });
                } else {
                    // Swipe left - next preset
                    nextPreset();
                    logEvent(analytics, 'swipe_preset', { direction: 'left' });
                }
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [selectedPresetIndex, analytics]);

    return (
        <div ref={editorContainerRef} className="relative w-full h-screen">
            {/* Fullscreen gradient canvas */}
            <div className="fixed w-full h-full top-0 left-0 z-0">
                <canvas className="w-full h-full block" ref={canvasRef} />
            </div>

            {/* Main scrollable content area with ref for scroll tracking */}
            <div
                ref={scrollContentRef}
                className="neat-scroll-content absolute inset-0 w-full h-full overflow-y-auto z-10"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'none',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {/* Spacer to enable scrolling - creates 300vh of scrollable space */}
                <div style={{ height: "300vh", width: "100%", pointerEvents: "none" }} />

                {/* Centered NEAT title overlay (visible only when UI is visible) */}
                {uiVisible && (
                    <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <div
                            className="relative p-2 select-none text-center flex flex-col items-center">
                            <div className="relative">
                                <h1
                                    className="font-sofia font-semibold mix-blend-soft-light opacity-50 text-[6rem] sm:text-[10rem] md:text-[14rem] leading-none neon-text"
                                    style={{ color: complementaryColor }}
                                >
                                    NEAT
                                </h1>
                                <h1
                                    className="absolute inset-0 flex items-center justify-center font-sofia font-semibold mix-blend-color-dodge opacity-70 text-[6rem] sm:text-[10rem] md:text-[14rem] leading-none shiny-text"
                                    style={{ color: complementaryColor }}
                                >
                                    NEAT
                                </h1>
                            </div>
                            <p
                                className="mt-3 uppercase text-sm sm:text-base md:text-lg drop-shadow-md"
                                style={{ color: isDarkColor(backgroundColor) ? "white" : "black" }}
                            >
                                Beautiful 3D gradient animations for your website
                            </p>
                        </div>
                    </div>
                )}

                {/* Compact floating toolbar (shown only when UI is visible) */}
                {uiVisible && (
                    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 bg-black/35 text-white backdrop-blur-md rounded-2xl sm:rounded-full px-3 py-1.5 shadow-lg max-w-[95vw]">
                        {/* Desktop: single row, Mobile: two rows */}
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                            {/* Row 1: Preset navigation */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Tooltip title="Previous preset (←)">
                                    <IconButton className="text-inherit"
                                                aria-label="Previous preset"
                                                onClick={prevPreset}>
                                        <ChevronLeft className="w-5 h-5"/>
                                    </IconButton>
                                </Tooltip>
                                <Select
                                    value={selectedPreset}
                                    className={fontClass + " text-base sm:text-lg py-1 rounded-md bg-transparent text-white w-44 sm:w-56 border-transparent"}
                                    onValueChange={(preset) => {
                                        logEvent(analytics, 'select_preset', { preset });
                                        setPreset(preset);
                                    }}
                                >
                                    {Object.keys(PRESETS).map((preset) => (
                                        <SelectItem className={fontMap[preset] + " "}
                                                    key={preset} value={preset}>
                                            {preset}
                                        </SelectItem>
                                    ))}
                                </Select>
                                <Tooltip title="Next preset (→)">
                                    <IconButton className="text-inherit"
                                                aria-label="Next preset"
                                                onClick={nextPreset}>
                                        <ChevronRight className="w-5 h-5"/>
                                    </IconButton>
                                </Tooltip>
                            </div>

                            {/* Divider - horizontal on mobile, vertical on desktop */}
                            <div className="w-full h-px sm:w-px sm:h-7 bg-white/20"/>

                            {/* Row 2: Action buttons */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Button size="sm" className="px-3 py-1"
                                        onClick={() => setDrawerOpen(true)}>
                                    Edit
                                </Button>
                                <div className="w-px h-7 bg-white/20"/>
                                <Tooltip title="Get the code">
                                    <Button variant="text" size="sm" className="px-2 py-1"
                                            onClick={() => {
                                                onGetTheCodeClick();
                                                logEvent(analytics, 'get_the_code');
                                            }}>
                                        Code
                                    </Button>
                                </Tooltip>
                                <Tooltip title="Download PNG">
                                    <IconButton className="text-inherit"
                                                aria-label="Download PNG"
                                                onClick={() => gradientRef.current?.downloadAsPNG()}>
                                        <Download className="w-5 h-5"/>
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={isRecording ? `Recording ${Math.round(recordingProgress * 100)}%` : "Record MP4"}>
                                    <IconButton className={`text-inherit ${isRecording ? 'animate-pulse' : ''}`}
                                                aria-label={isRecording ? "Recording…" : "Record MP4"}
                                                onClick={() => setRecordDialogOpen(true)}>
                                        {isRecording
                                            ? <Square className="w-4 h-4" fill="#ef4444" stroke="#ef4444"/>
                                            : <Video className="w-5 h-5"/>
                                        }
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Import config">
                                    <IconButton className="text-inherit"
                                                aria-label="Import config"
                                                onClick={() => setImportDialogOpen(true)}>
                                        <Import className="w-5 h-5"/>
                                    </IconButton>
                                </Tooltip>
                                <div className="w-px h-7 bg-white/20"/>
                                <Tooltip title="Hide UI (H)">
                                    <IconButton className="text-inherit"
                                                aria-label="Hide UI"
                                                onClick={() => {
                                                    setUiVisible(false);
                                                    logEvent(analytics, 'hide_ui');
                                                }}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    </IconButton>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick restore when UI is hidden - small icon in bottom left */}
                {!uiVisible && (
                    <div className="fixed bottom-6 left-6 z-20">
                        <Tooltip title="Show UI (H)">
                            <IconButton
                                aria-label="Show UI"
                                className="bg-black/30 text-white backdrop-blur-md hover:bg-black/50 transition-all p-2 rounded-full shadow-lg"
                                onClick={() => setUiVisible(true)}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </IconButton>
                        </Tooltip>
                    </div>
                )}

                {/* FPS counter overlay */}
                {uiVisible && (
                    <div className="fixed top-6 left-6 z-20 bg-black/20 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-lg font-mono text-[11px] leading-tight select-none"
                         style={{ color: isDarkColor(backgroundColor) ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                        <div className="font-semibold text-sm" style={{ color: isDarkColor(backgroundColor) ? 'white' : 'black' }}>
                            {fps} <span className="font-normal text-[10px]" style={{ opacity: 0.6 }}>FPS</span>
                        </div>
                        <div className="flex gap-3 mt-0.5" style={{ opacity: 0.7 }}>
                            <span>▼ {fpsMin === Infinity ? '–' : fpsMin}</span>
                            <span>▲ {fpsMax === 0 ? '–' : fpsMax}</span>
                        </div>
                    </div>
                )}

                {/* Footer with links (always visible) */}
                {uiVisible && (
                    <div className="fixed bottom-6 left-6 z-10 text-left space-y-1">
                        <div className="text-xs opacity-50 hover:opacity-80 transition-opacity">
                            <a
                                href="https://firecms.co"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                style={{ color: isDarkColor(backgroundColor) ? "white" : "black" }}
                                onClick={() => logEvent(analytics, 'click_firecms_link', { location: 'footer' })}
                            >
                                Made by FireCMS
                            </a>
                        </div>
                        <div className="hover:opacity-80 transition-opacity">
                            <a
                                href="https://github.com/FireCMSco/neat"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => logEvent(analytics, 'click_github_link', { location: 'footer' })}
                            >
                                <img
                                    src="https://img.shields.io/github/stars/FireCMSco/neat?style=social"
                                    alt="GitHub stars"
                                    style={{ height: 20 }}
                                />
                            </a>
                        </div>
                        <div className="text-xs opacity-50 hover:opacity-80 transition-opacity">
                            <a
                                href="mailto:hello@firecms.co"
                                className="hover:underline"
                                style={{ color: isDarkColor(backgroundColor) ? "white" : "black" }}
                                onClick={() => logEvent(analytics, 'click_email', { location: 'footer' })}
                            >
                                hello@firecms.co
                            </a>
                        </div>
                    </div>
                )}

                {/* Right controls panel (shown only when UI is visible) */}
                {uiVisible && (
                    <Sheet
                        open={drawerOpen}
                        className={"w-[380px] bg-neutral-900/75 text-white backdrop-blur-md border border-white/10 h-full"}
                        onOpenChange={setDrawerOpen}
                        side={"right"}
                    >
                        <IconButton
                            aria-label="Close editor panel"
                            onClick={handleDrawerClose}
                            className="fixed left-4 top-4 bg-black/20 text-white p-2 rounded-full"
                        >
                            <ChevronLeft className="w-6 h-6"/>
                        </IconButton>

                        <div className="flex flex-col h-full">
                            <div
                                className="p-4 pt-20 flex flex-col gap-6 overflow-auto flex-grow panel-scroll">
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-[10px] tracking-widest font-bold uppercase opacity-70">Preset</span>
                                    <span className="text-[10px] opacity-50">← → to browse</span>
                                </div>

                                <Select
                                    value={selectedPreset}
                                    className={fontClass + " text-xl bg-white/10 border border-white/20 rounded-lg px-2 py-1"}
                                    onValueChange={(preset) => {
                                        logEvent(analytics, 'select_preset', { preset });
                                        setPreset(preset);
                                    }}
                                >
                                    {Object.keys(PRESETS).map((preset) => (
                                        <SelectItem
                                            className={fontMap[preset] + " "}
                                            key={preset}
                                            value={preset}
                                        >
                                            {preset}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <div
                                    className="bg-white/10 border border-white/20 rounded-xl p-3">
                                    <div
                                        className="flex space-x-4 justify-evenly mt-1 mb-1">
                                        {colors.map((color, index) => (
                                            <ColorSwatch
                                                key={index}
                                                color={color}
                                                showEnabled={true}
                                                onChange={(newColor) => handleColorChange(newColor, index)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Procedural Texture section - moved to top for better UX */}
                                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="font-semibold text-sm mb-2">Procedural Texture</div>
                                    <Label
                                        className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                        <span className="text-xs w-28 text-right">Enable</span>
                                        <div className={"w-full flex"}>
                                            <Checkbox
                                                checked={enableProceduralTexture}
                                                onChange={(checked: boolean) => setEnableProceduralTexture(checked)}/>
                                        </div>
                                    </Label>
                                    {enableProceduralTexture && (
                                        <div className="text-xs opacity-70 italic mt-2 pl-2">
                                            ℹ️ Texture replaces color pressure controls
                                        </div>
                                    )}
                                    {enableProceduralTexture && (
                                        <>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Gap Frequency</span>
                                                <Slider
                                                    value={[textureVoidLikelihood]}
                                                    step={0.01} min={0} max={1}
                                                    onValueChange={(v) => setTextureVoidLikelihood(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Min Gap Width</span>
                                                <Slider
                                                    value={[textureVoidWidthMin]}
                                                    step={10} min={10} max={200}
                                                    onValueChange={(v) => setTextureVoidWidthMin(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Max Gap Width</span>
                                                <Slider
                                                    value={[textureVoidWidthMax]}
                                                    step={10} min={50} max={600}
                                                    onValueChange={(v) => setTextureVoidWidthMax(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Band Density</span>
                                                <Slider value={[textureBandDensity]}
                                                        step={0.1} min={0.1} max={3}
                                                        onValueChange={(v) => setTextureBandDensity(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Color Blending</span>
                                                <Slider
                                                    value={[textureColorBlending]}
                                                    step={0.01} min={0} max={1}
                                                    onValueChange={(v) => setTextureColorBlending(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Seed</span>
                                                <Slider value={[textureSeed]}
                                                        step={1} min={0} max={1000}
                                                        onValueChange={(v) => setTextureSeed(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Ease (Flow↔Image)</span>
                                                <Slider value={[textureEase]}
                                                        step={0.01} min={0} max={1}
                                                        onValueChange={(v) => setTextureEase(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Void Color</span>
                                                <div className="flex items-center gap-2 w-full">
                                                    <ColorSwatch
                                                        color={{
                                                            color: proceduralBackgroundColor,
                                                            enabled: true
                                                        }}
                                                        showEnabled={false}
                                                        onChange={(c) => setProceduralBackgroundColor(c.color)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Triangles</span>
                                                <Slider
                                                    value={[textureShapeTriangles]}
                                                    step={1} min={0} max={100}
                                                    onValueChange={(v) => setTextureShapeTriangles(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Circles</span>
                                                <Slider
                                                    value={[textureShapeCircles]}
                                                    step={1} min={0} max={100}
                                                    onValueChange={(v) => setTextureShapeCircles(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Bars</span>
                                                <Slider value={[textureShapeBars]}
                                                        step={1} min={0} max={100}
                                                        onValueChange={(v) => setTextureShapeBars(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Squiggles</span>
                                                <Slider
                                                    value={[textureShapeSquiggles]}
                                                    step={1} min={0} max={100}
                                                    onValueChange={(v) => setTextureShapeSquiggles(v[0] as number)}/>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Color pressure section - disabled when texture is enabled */}
                                <div className={`space-y-2 bg-white/5 border border-white/10 rounded-xl p-3 transition-opacity ${enableProceduralTexture ? 'opacity-40 pointer-events-none' : ''}`}>
                                    <div className="font-semibold text-sm mb-2 flex items-center justify-between">
                                        <span>Color Pressure</span>
                                        {enableProceduralTexture && (
                                            <span className="text-[10px] opacity-60">Disabled with texture</span>
                                        )}
                                    </div>
                                    <div className="flex flex-row gap-2 items-end">
                                        <span className="w-28 text-right pr-2 text-xs">Blending</span>
                                        <Slider value={[colorBlending]} min={0}
                                                max={10}
                                                disabled={enableProceduralTexture}
                                                onValueChange={(v) => setColorBlending(v[0] as number)}/>
                                    </div>
                                    <div className="flex flex-row gap-2 items-end">
                                        <span className="w-28 text-right pr-2 text-xs">Horizontal</span>
                                        <Slider value={[horizontalPressure]} min={0}
                                                max={10}
                                                disabled={enableProceduralTexture}
                                                onValueChange={(v) => setHorizontalPressure(v[0] as number)}/>
                                    </div>
                                    <div className="flex flex-row gap-2 items-end">
                                        <span className="w-28 text-right pr-2 text-xs">Vertical</span>
                                        <Slider value={[verticalPressure]} min={0}
                                                max={10}
                                                disabled={enableProceduralTexture}
                                                onValueChange={(v) => setVerticalPressure(v[0] as number)}/>
                                    </div>
                                </div>

                                {/* Animation section */}
                                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="font-semibold text-sm mb-2">Animation</div>
                                    <div className="flex flex-row gap-2 items-end">
                                        <span className="w-28 text-right pr-2 text-xs">Speed</span>
                                        <Slider
                                            value={[speed]}
                                            step={.5}
                                            min={0}
                                            max={10}
                                            onValueChange={(v) => setSpeed(v[0] as number)}
                                        />
                                    </div>
                                    {speed === 0 && (
                                        <div className="text-xs opacity-70 italic mt-2 pl-2">
                                            ℹ️ Animation paused - Waves and Flow frozen
                                        </div>
                                    )}
                                </div>

                                {/* Shape section */}
                                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="font-semibold text-sm mb-2">Shape</div>
                                    <Tooltip
                                        title={"The density of triangles in the 3D mesh. Reduce to increase performance"}>
                                        <div className="flex flex-row gap-2 items-end">
                                            <span className="w-28 text-right pr-2 text-xs">Resolution</span>
                                            <Slider value={[resolution]} step={0.05}
                                                    min={0.05} max={2}
                                                    onValueChange={(v) => setResolution(v[0] as number)}/>
                                        </div>
                                    </Tooltip>
                                    <div className="flex flex-row gap-2 items-center">
                                        <span className="w-28 text-right pr-2 text-xs">Vertical Offset</span>
                                        <Slider
                                            value={[yOffset]}
                                            step={1}
                                            min={0}
                                            max={100000}
                                            onValueChange={(v) => setYOffset(v[0] as number)}/>
                                    </div>
                                    <div className="flex flex-row gap-2 items-center">
                                        <span className="w-28 text-right pr-2 text-xs">Wave Multiplier</span>
                                        <Slider
                                            value={[yOffsetWaveMultiplier]}
                                            step={0.1}
                                            min={0}
                                            max={20}
                                            onValueChange={(v) => setYOffsetWaveMultiplier(v[0] as number)}/>
                                    </div>
                                    <div className="flex flex-row gap-2 items-center">
                                        <span className="w-28 text-right pr-2 text-xs">Color Multiplier</span>
                                        <Slider
                                            value={[yOffsetColorMultiplier]}
                                            step={0.1}
                                            min={0}
                                            max={20}
                                            onValueChange={(v) => setYOffsetColorMultiplier(v[0] as number)}/>
                                    </div>
                                    <div className="flex flex-row gap-2 items-center">
                                        <span className="w-28 text-right pr-2 text-xs">Flow Multiplier</span>
                                        <Slider
                                            value={[yOffsetFlowMultiplier]}
                                            step={0.1}
                                            min={0}
                                            max={20}
                                            onValueChange={(v) => setYOffsetFlowMultiplier(v[0] as number)}/>
                                    </div>
                                    <Label
                                        className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                        <span className="text-xs w-28 text-right">Wireframe</span>
                                        <div className={"w-full flex"}>
                                            <Checkbox checked={wireframe}
                                                      onChange={(checked: boolean) => setWireframe(checked)}/>
                                        </div>
                                    </Label>
                                    {wireframe && (
                                        <div className="text-xs opacity-70 italic mt-2 pl-2">
                                            ℹ️ Wireframe mode: colors, grain, and texture effects are less visible
                                        </div>
                                    )}
                                </div>

                                {/* Waves section - disabled when speed is 0 */}
                                <div className={`space-y-2 bg-white/5 border border-white/10 rounded-xl p-3 transition-opacity ${speed === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                                    <div className="font-semibold text-sm mb-2 flex items-center justify-between">
                                        <span>Waves</span>
                                        {speed === 0 && (
                                            <span className="text-[10px] opacity-60">Needs animation speed</span>
                                        )}
                                    </div>
                                    <div className="flex flex-row gap-2 items-end">
                                        <span className="w-28 text-right pr-2 text-xs">Frequency X</span>
                                        <Slider value={[waveFrequencyX]} min={0}
                                                max={10}
                                                disabled={speed === 0}
                                                onValueChange={(v) => setWaveFrequencyX(v[0] as number)}/>
                                    </div>
                                    <div className="flex flex-row gap-2 items-end">
                                        <span className="w-28 text-right pr-2 text-xs">Frequency Y</span>
                                        <Slider value={[waveFrequencyY]} min={0}
                                                max={10}
                                                disabled={speed === 0}
                                                onValueChange={(v) => setWaveFrequencyY(v[0] as number)}/>
                                    </div>
                                    <div className="flex flex-row gap-2 items-end">
                                        <span className="w-28 text-right pr-2 text-xs">Amplitude</span>
                                        <Slider value={[waveAmplitude]} min={0}
                                                max={10}
                                                disabled={speed === 0}
                                                onValueChange={(v) => setWaveAmplitude(v[0] as number)}/>
                                    </div>
                                </div>

                                {/* Visual Effects section - grouping post-processing and grain */}
                                <div className={`space-y-3 bg-white/5 border border-white/10 rounded-xl p-3 transition-opacity ${wireframe ? 'opacity-70' : ''}`}>
                                    <div className="font-semibold text-sm flex items-center justify-between">
                                        <span>Visual Effects</span>
                                        {wireframe && (
                                            <span className="text-[10px] opacity-60">Less visible in wireframe</span>
                                        )}
                                    </div>

                                    {/* Post-processing */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <div className="text-xs font-semibold mb-1">Color Adjustment</div>
                                        <div className="flex flex-row gap-2 items-end">
                                            <span className="w-28 text-right pr-2 text-xs">Shadows</span>
                                            <Slider value={[shadows]} min={0} max={10}
                                                    onValueChange={(v) => setShadows(v[0] as number)}/>
                                        </div>
                                        <div className="flex flex-row gap-2 items-end">
                                            <span className="w-28 text-right pr-2 text-xs">Highlights</span>
                                            <Slider value={[highlights]} min={0}
                                                    max={10}
                                                    onValueChange={(v) => setHighlights(v[0] as number)}/>
                                        </div>
                                        <div className="flex flex-row gap-2 items-end">
                                            <span className="w-28 text-right pr-2 text-xs">Saturation</span>
                                            <Slider value={[saturation]} min={-10}
                                                    max={10}
                                                    onValueChange={(v) => setSaturation(v[0] as number)}/>
                                        </div>
                                        <div className="flex flex-row gap-2 items-end">
                                            <span className="w-28 text-right pr-2 text-xs">Brightness</span>
                                            <Slider value={[brightness]} step={0.05}
                                                    min={0} max={10}
                                                    onValueChange={(v) => setBrightness(v[0] as number)}/>
                                        </div>
                                    </div>

                                    {/* Grain */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <div className="text-xs font-semibold mb-1">Grain</div>
                                        <div className="flex flex-row gap-2 items-center">
                                            <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                            <Slider value={[grainIntensity]}
                                                    step={0.025} min={0} max={1}
                                                    onValueChange={(v) => setGrainIntensity(v[0] as number)}/>
                                        </div>
                                        <div className={`space-y-2 transition-opacity ${grainIntensity === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Scale</span>
                                                <Slider value={[grainScale]} step={1}
                                                        min={0} max={100}
                                                        disabled={grainIntensity === 0}
                                                        onValueChange={(v) => setGrainScale(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Sparsity</span>
                                                <Slider value={[grainSparsity]} step={.02}
                                                        min={0} max={1}
                                                        disabled={grainIntensity === 0}
                                                        onValueChange={(v) => setGrainSparsity(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Speed</span>
                                                <Slider value={[grainSpeed]} step={0.1}
                                                        min={0} max={10}
                                                        disabled={grainIntensity === 0}
                                                        onValueChange={(v) => setGrainSpeed(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Background section */}
                                <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="font-semibold text-sm mb-2">Background</div>
                                    <div className="flex flex-row gap-2 items-center">
                                        <span className="w-28 text-right pr-2 text-xs">Color</span>
                                        <div className={"w-full flex my-4"}>
                                            <div className="text-center pl-2">
                                                <ColorSwatch
                                                    color={{
                                                        color: backgroundColor,
                                                        enabled: true
                                                    }}
                                                    showEnabled={false}
                                                    onChange={color => setBackgroundColor(color.color)}
                                                />
                                            </div>
                                            <div className="flex-grow pl-2 flex flex-col gap-2">
                                                <span className="text-xs">Alpha</span>
                                                <Slider value={[backgroundAlpha]}
                                                        step={0.05} min={0} max={1}
                                                        onValueChange={(v) => setBackgroundAlpha(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Distortion Effects section - grouping related features */}
                                <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="font-semibold text-sm">Distortion Effects</div>

                                    {/* Flow Field subsection */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <Label
                                            className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                            <span className="text-xs w-24 text-right font-semibold">Flow Field</span>
                                            <div className={"w-full flex"}>
                                                <Checkbox checked={flowEnabled}
                                                          onChange={(checked: boolean) => setFlowEnabled(checked)}/>
                                            </div>
                                        </Label>
                                        {speed === 0 && flowEnabled && (
                                            <div className="text-xs opacity-70 italic pl-2">
                                                ⚠️ Flow needs animation speed &gt; 0
                                            </div>
                                        )}
                                        <div className={`space-y-2 transition-opacity ${!flowEnabled || speed === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Wave Amplitude</span>
                                                <Slider value={[flowDistortionA]} step={0.1}
                                                        min={0} max={5}
                                                        disabled={!flowEnabled || speed === 0}
                                                        onValueChange={(v) => setFlowDistortionA(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Wave Frequency</span>
                                                <Slider value={[flowDistortionB]} step={0.1}
                                                        min={0} max={10}
                                                        disabled={!flowEnabled || speed === 0}
                                                        onValueChange={(v) => setFlowDistortionB(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Wave Scale</span>
                                                <Slider value={[flowScale]} step={0.1}
                                                        min={0} max={5}
                                                        disabled={!flowEnabled || speed === 0}
                                                        onValueChange={(v) => setFlowScale(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Ease (Blend)</span>
                                                <Slider value={[flowEase]} step={0.01}
                                                        min={0} max={1}
                                                        disabled={!flowEnabled || speed === 0}
                                                        onValueChange={(v) => setFlowEase(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Domain Warp subsection */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <Label
                                            className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                            <span className="text-xs w-24 text-right font-semibold">Domain Warp</span>
                                            <div className={"w-full flex"}>
                                                <Checkbox checked={domainWarpEnabled}
                                                          onChange={(checked: boolean) => setDomainWarpEnabled(checked)}/>
                                            </div>
                                        </Label>
                                        <div className={`space-y-2 transition-opacity ${!domainWarpEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                                <Slider value={[domainWarpIntensity]} step={0.05}
                                                        min={0} max={1.5}
                                                        disabled={!domainWarpEnabled}
                                                        onValueChange={(v) => setDomainWarpIntensity(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Scale</span>
                                                <Slider value={[domainWarpScale]} step={0.1}
                                                        min={0.5} max={10}
                                                        disabled={!domainWarpEnabled}
                                                        onValueChange={(v) => setDomainWarpScale(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                {/* Post-Processing Effects section */}
                                <div className="space-y-3 bg-white/5 border border-white/10 rounded-xl p-3">
                                    <div className="font-semibold text-sm">Post-Processing</div>

                                    {/* Vignette */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <div className="text-xs font-semibold mb-1">Vignette</div>
                                        <div className="flex flex-row gap-2 items-center">
                                            <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                            <Slider value={[vignetteIntensity]} step={0.05}
                                                    min={0} max={1}
                                                    onValueChange={(v) => setVignetteIntensity(v[0] as number)}/>
                                        </div>
                                        <div className={`space-y-2 transition-opacity ${vignetteIntensity === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Radius</span>
                                                <Slider value={[vignetteRadius]} step={0.05}
                                                        min={0.1} max={1}
                                                        disabled={vignetteIntensity === 0}
                                                        onValueChange={(v) => setVignetteRadius(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bloom */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <div className="text-xs font-semibold mb-1">Bloom</div>
                                        <div className="flex flex-row gap-2 items-center">
                                            <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                            <Slider value={[bloomIntensity]} step={0.1}
                                                    min={0} max={3}
                                                    onValueChange={(v) => setBloomIntensity(v[0] as number)}/>
                                        </div>
                                        <div className={`space-y-2 transition-opacity ${bloomIntensity === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Threshold</span>
                                                <Slider value={[bloomThreshold]} step={0.05}
                                                        min={0} max={1}
                                                        disabled={bloomIntensity === 0}
                                                        onValueChange={(v) => setBloomThreshold(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chromatic Aberration */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <div className="text-xs font-semibold mb-1">Chromatic Aberration</div>
                                        <div className="flex flex-row gap-2 items-center">
                                            <span className="w-28 text-right pr-2 text-xs">Amount</span>
                                            <Slider value={[chromaticAberration]} step={0.5}
                                                    min={0} max={20}
                                                    onValueChange={(v) => setChromaticAberration(v[0] as number)}/>
                                        </div>
                                    </div>

                                    {/* Fresnel */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <Label
                                            className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                            <span className="text-xs w-24 text-right font-semibold">Rim Glow</span>
                                            <div className={"w-full flex"}>
                                                <Checkbox checked={fresnelEnabled}
                                                          onChange={(checked: boolean) => setFresnelEnabled(checked)}/>
                                            </div>
                                        </Label>
                                        <div className={`space-y-2 transition-opacity ${!fresnelEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Power</span>
                                                <Slider value={[fresnelPower]} step={0.1}
                                                        min={0.5} max={5}
                                                        disabled={!fresnelEnabled}
                                                        onValueChange={(v) => setFresnelPower(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                                <Slider value={[fresnelIntensity]} step={0.1}
                                                        min={0} max={3}
                                                        disabled={!fresnelEnabled}
                                                        onValueChange={(v) => setFresnelIntensity(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Color</span>
                                                <div className="w-full flex">
                                                    <ColorSwatch
                                                        color={{ color: fresnelColor, enabled: true }}
                                                        showEnabled={false}
                                                        onChange={(c) => setFresnelColor(c.color)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Iridescence */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <Label
                                            className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                            <span className="text-xs w-24 text-right font-semibold">Iridescence</span>
                                            <div className={"w-full flex"}>
                                                <Checkbox checked={iridescenceEnabled}
                                                          onChange={(checked: boolean) => setIridescenceEnabled(checked)}/>
                                            </div>
                                        </Label>
                                        <div className={`space-y-2 transition-opacity ${!iridescenceEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                                <Slider value={[iridescenceIntensity]} step={0.05}
                                                        min={0} max={1}
                                                        disabled={!iridescenceEnabled}
                                                        onValueChange={(v) => setIridescenceIntensity(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Speed</span>
                                                <Slider value={[iridescenceSpeed]} step={0.1}
                                                        min={0} max={5}
                                                        disabled={!iridescenceEnabled}
                                                        onValueChange={(v) => setIridescenceSpeed(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Overlays section */}

                            </div>

                            <div className="relative pb-4 px-4 pt-2 bg-neutral-700">
                                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-neutral-700 to-transparent pointer-events-none" />
                                <Button
                                    size={"lg"}
                                    className="w-full"
                                    onClick={() => {
                                        onGetTheCodeClick();
                                        logEvent(analytics, 'get_the_code');
                                    }}
                                >
                                    Get the code
                                </Button>
                            </div>
                        </div>
                    </Sheet>
                )}

                {/* Dialogs */}
                <GetCodeDialog open={dialogOpen} onOpenChange={setDialogOpen}
                               config={config}/>
                <ImportConfigDialog open={importDialogOpen}
                                    onOpenChange={setImportDialogOpen}
                                    onConfigImport={handleConfigImport}/>

                {/* Record Video Dialog */}
                <Dialog open={recordDialogOpen} maxWidth="24rem" onOpenChange={(open) => {
                    if (!open && !isRecording) setRecordDialogOpen(false);
                    else if (open) setRecordDialogOpen(true);
                }}>
                    <DialogTitle>Record MP4</DialogTitle>
                    <DialogContent>
                        <div className="space-y-5">
                            {/* Duration */}
                            <div>
                                <span className="text-[10px] tracking-widest font-bold uppercase opacity-70">Duration</span>
                                <div className="flex items-center gap-2 mt-2">
                                    {[3, 5, 10, 15, 30].map((d) => (
                                        <button
                                            key={d}
                                            disabled={isRecording}
                                            onClick={() => setRecordDuration(d)}
                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                                recordDuration === d
                                                    ? 'bg-white text-black border-white font-semibold'
                                                    : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'
                                            } ${isRecording ? 'opacity-40 pointer-events-none' : ''}`}
                                        >
                                            {d}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resolution */}
                            <div className={isRecording ? 'opacity-40 pointer-events-none' : ''}>
                                <span className="text-[10px] tracking-widest font-bold uppercase opacity-70">Resolution</span>
                                <div className="mt-2">
                                    <Select
                                        value={recordResolution}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1"
                                        onValueChange={(v) => setRecordResolution(v)}
                                    >
                                        <SelectItem value="current">Current size</SelectItem>
                                        <SelectItem value="720p">720p (1280×720)</SelectItem>
                                        <SelectItem value="1080p">1080p (1920×1080)</SelectItem>
                                        <SelectItem value="4k">4K (3840×2160)</SelectItem>
                                    </Select>
                                </div>
                            </div>

                            {/* Progress bar (visible during recording) */}
                            {isRecording && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] tracking-widest font-bold uppercase text-red-400">● Recording</span>
                                        <span className="text-xs font-mono tabular-nums opacity-70">
                                            {Math.round(recordingProgress * recordDuration)}s / {recordDuration}s
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 rounded-full transition-[width] duration-300 ease-linear"
                                            style={{ width: `${recordingProgress * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                    <DialogActions>
                        {!isRecording ? (
                            <>
                                <Button variant="text" className="text-xs px-3 py-1" onClick={() => setRecordDialogOpen(false)}>Cancel</Button>
                                <Button className="text-xs px-3 py-1" onClick={handleStartRecording}>Record</Button>
                            </>
                        ) : (
                            <Button className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700" onClick={handleStopRecording}>Stop</Button>
                        )}
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    );
}
