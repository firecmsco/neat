import React, { useEffect, useRef } from "react";
import "@fontsource/sofia-sans";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { IconButton } from "./ui/icon-button";
import { Label } from "./ui/label";
import { Select, SelectItem } from "./ui/select";
import { Sheet } from "./ui/sheet";
import { Slider } from "./ui/slider";
import { Tooltip } from "./ui/tooltip";
import { ChevronLeft, ChevronRight, Download, Import } from "lucide-react";
import { ColorSwatch } from "./ColorSwatch";
import { fontMap, NEAT_PRESET, PRESETS } from "./presets";
import { getComplementaryColor, isDarkColor } from "../utils/colors";
import { GetCodeDialog } from "./GetCodeDialog";
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

    // Global UI visibility
    const [uiVisible, setUiVisible] = React.useState<boolean>(true);

    const editorContainerRef = React.useRef<HTMLDivElement | null>(null);
    const scrollContentRef = React.useRef<HTMLDivElement | null>(null);

    const handleDrawerClose = () => setDrawerOpen(false);

    const handleConfigImport = (importedConfig: NeatConfig) => {
        updatePresetConfig(importedConfig);
    };

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

        // Flow field
        if (config.flowDistortionA !== undefined) setFlowDistortionA(config.flowDistortionA);
        if (config.flowDistortionB !== undefined) setFlowDistortionB(config.flowDistortionB);
        if (config.flowScale !== undefined) setFlowScale(config.flowScale);
        if (config.flowEase !== undefined) setFlowEase(config.flowEase);
        if (config.flowEnabled !== undefined) setFlowEnabled(config.flowEnabled);

        // Mouse interaction
        if (config.mouseDistortionStrength !== undefined) setMouseDistortionStrength(config.mouseDistortionStrength);
        if (config.mouseDistortionRadius !== undefined) setMouseDistortionRadius(config.mouseDistortionRadius);
        if (config.mouseDecayRate !== undefined) setMouseDecayRate(config.mouseDecayRate);
        if (config.mouseDarken !== undefined) setMouseDarken(config.mouseDarken);

        // Texture generation
        if (config.enableProceduralTexture !== undefined) setEnableProceduralTexture(config.enableProceduralTexture);
        if (config.textureVoidLikelihood !== undefined) setTextureVoidLikelihood(config.textureVoidLikelihood);
        if (config.textureVoidWidthMin !== undefined) setTextureVoidWidthMin(config.textureVoidWidthMin);
        if (config.textureVoidWidthMax !== undefined) setTextureVoidWidthMax(config.textureVoidWidthMax);
        if (config.textureBandDensity !== undefined) setTextureBandDensity(config.textureBandDensity);
        if (config.textureColorBlending !== undefined) setTextureColorBlending(config.textureColorBlending);
        if (config.textureSeed !== undefined) setTextureSeed(config.textureSeed);
        if (config.proceduralBackgroundColor !== undefined) setProceduralBackgroundColor(config.proceduralBackgroundColor);
        setTextureShapeTriangles(config.textureShapeTriangles ?? 20);
        setTextureShapeCircles(config.textureShapeCircles ?? 15);
        setTextureShapeBars(config.textureShapeBars ?? 15);
        setTextureShapeSquiggles(config.textureShapeSquiggles ?? 10);
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

    // Flow field parameters
    const [flowDistortionA, setFlowDistortionA] = React.useState<number>(defaultConfig.flowDistortionA ?? 0);
    const [flowDistortionB, setFlowDistortionB] = React.useState<number>(defaultConfig.flowDistortionB ?? 0);
    const [flowScale, setFlowScale] = React.useState<number>(defaultConfig.flowScale ?? 1.0);
    const [flowEase, setFlowEase] = React.useState<number>(defaultConfig.flowEase ?? 0.0);
    const [flowEnabled, setFlowEnabled] = React.useState<boolean>(defaultConfig.flowEnabled ?? true);

    // Mouse interaction parameters
    const [mouseDistortionStrength, setMouseDistortionStrength] = React.useState<number>(defaultConfig.mouseDistortionStrength ?? 0.0);
    const [mouseDistortionRadius, setMouseDistortionRadius] = React.useState<number>(defaultConfig.mouseDistortionRadius ?? 0.25);
    const [mouseDecayRate, setMouseDecayRate] = React.useState<number>(defaultConfig.mouseDecayRate ?? 0.96);
    const [mouseDarken, setMouseDarken] = React.useState<number>(defaultConfig.mouseDarken ?? 0.0);

    // Texture generation parameters
    const [enableProceduralTexture, setEnableProceduralTexture] = React.useState<boolean>(defaultConfig.enableProceduralTexture ?? false);
    const [textureVoidLikelihood, setTextureVoidLikelihood] = React.useState<number>(defaultConfig.textureVoidLikelihood ?? 0.45);
    const [textureVoidWidthMin, setTextureVoidWidthMin] = React.useState<number>(defaultConfig.textureVoidWidthMin ?? 200);
    const [textureVoidWidthMax, setTextureVoidWidthMax] = React.useState<number>(defaultConfig.textureVoidWidthMax ?? 486);
    const [textureBandDensity, setTextureBandDensity] = React.useState<number>(defaultConfig.textureBandDensity ?? 2.15);
    const [textureColorBlending, setTextureColorBlending] = React.useState<number>(defaultConfig.textureColorBlending ?? 0.01);
    const [textureSeed, setTextureSeed] = React.useState<number>(defaultConfig.textureSeed ?? 333);
    const [proceduralBackgroundColor, setProceduralBackgroundColor] = React.useState<string>(defaultConfig.proceduralBackgroundColor ?? "#000000");
    const [textureShapeTriangles, setTextureShapeTriangles] = React.useState<number>(defaultConfig.textureShapeTriangles ?? 20);
    const [textureShapeCircles, setTextureShapeCircles] = React.useState<number>(defaultConfig.textureShapeCircles ?? 15);
    const [textureShapeBars, setTextureShapeBars] = React.useState<number>(defaultConfig.textureShapeBars ?? 15);
    const [textureShapeSquiggles, setTextureShapeSquiggles] = React.useState<number>(defaultConfig.textureShapeSquiggles ?? 10);

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
        mouseDistortionStrength: number;
        mouseDistortionRadius: number;
        mouseDecayRate: number;
        mouseDarken: number;
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
        mouseDistortionStrength: defaultConfig.mouseDistortionStrength ?? 0.0,
        mouseDistortionRadius: defaultConfig.mouseDistortionRadius ?? 0.25,
        mouseDecayRate: defaultConfig.mouseDecayRate ?? 0.96,
        mouseDarken: defaultConfig.mouseDarken ?? 0.0,
    }));

    const tweenStartRef = React.useRef<number | null>(null);
    const tweenFromRef = React.useRef<TweenState | null>(null);
    const tweenToRef = React.useRef<TweenState | null>(null);
    const tweenRafRef = React.useRef<number | null>(null);

    // Scroll Handler
    useEffect(() => {
        const container = editorContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement;
            if (target && target.closest(".panel-scroll")) {
                return;
            }
            e.preventDefault();
            setYOffset(prev => prev + e.deltaY * 0.5);
        };

        container.addEventListener("wheel", handleWheel, { passive: false });
        return () => container.removeEventListener("wheel", handleWheel as EventListener);
    }, []);

    // 1. TWEEN LOOP (Performance Heavy) - Removed yOffset
    useEffect(() => {
        const target: TweenState = {
            speed, horizontalPressure, verticalPressure, waveFrequencyX, waveFrequencyY, waveAmplitude,
            shadows, highlights, saturation, brightness, colorBlending, resolution, backgroundAlpha,
            grainIntensity, grainSparsity, grainScale, grainSpeed,
            // yOffset REMOVED
            flowDistortionA, flowDistortionB, flowScale, flowEase,
            mouseDistortionStrength, mouseDistortionRadius, mouseDecayRate, mouseDarken,
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
        mouseDistortionStrength, mouseDistortionRadius, mouseDecayRate, mouseDarken,
    ]);

    // 2. IMMEDIATE SCROLL UPDATE (New Effect)
    // This updates the gradient instantly without tweening lag
    useEffect(() => {
        if (gradientRef.current) {
            gradientRef.current.yOffset = yOffset;
        }
    }, [yOffset]);

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
            flowDistortionA: tweened.flowDistortionA,
            flowDistortionB: tweened.flowDistortionB,
            flowScale: tweened.flowScale,
            flowEase: tweened.flowEase,
            flowEnabled,
            mouseDistortionStrength: tweened.mouseDistortionStrength,
            mouseDistortionRadius: tweened.mouseDistortionRadius,
            mouseDecayRate: tweened.mouseDecayRate,
            mouseDarken: tweened.mouseDarken,
            enableProceduralTexture,
            textureVoidLikelihood,
            textureVoidWidthMin,
            textureVoidWidthMax,
            textureBandDensity,
            textureColorBlending,
            textureSeed,
            proceduralBackgroundColor,
            textureShapeTriangles,
            textureShapeCircles,
            textureShapeBars,
            textureShapeSquiggles,
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
        gradientRef.current.mouseDistortionStrength = tweened.mouseDistortionStrength;
        gradientRef.current.mouseDistortionRadius = tweened.mouseDistortionRadius;
        gradientRef.current.mouseDecayRate = tweened.mouseDecayRate;
        gradientRef.current.mouseDarken = tweened.mouseDarken;
        gradientRef.current.enableProceduralTexture = enableProceduralTexture;
        gradientRef.current.textureVoidLikelihood = textureVoidLikelihood;
        gradientRef.current.textureVoidWidthMin = textureVoidWidthMin;
        gradientRef.current.textureVoidWidthMax = textureVoidWidthMax;
        gradientRef.current.textureBandDensity = textureBandDensity;
        gradientRef.current.textureColorBlending = textureColorBlending;
        gradientRef.current.textureSeed = textureSeed;
        gradientRef.current.proceduralBackgroundColor = proceduralBackgroundColor;
        // @ts-ignore
        gradientRef.current.textureShapeTriangles = textureShapeTriangles;
        // @ts-ignore
        gradientRef.current.textureShapeCircles = textureShapeCircles;
        // @ts-ignore
        gradientRef.current.textureShapeBars = textureShapeBars;
        // @ts-ignore
        gradientRef.current.textureShapeSquiggles = textureShapeSquiggles;
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
        textureShapeTriangles,
        textureShapeCircles,
        textureShapeBars,
        textureShapeSquiggles,
        flowEnabled,
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

        // Mouse interaction with 30% chance of being enabled
        if (Math.random() < 0.3) {
            setMouseDistortionStrength(randomInRange(0.1, 2));
            setMouseDistortionRadius(randomInRange(0.1, 2));
            setMouseDecayRate(randomInRange(0.90, 0.99));
            setMouseDarken(randomInRange(0, 0.5));
        } else {
            setMouseDistortionStrength(0);
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
        // Flow field
        flowDistortionA,
        flowDistortionB,
        flowScale,
        flowEase,
        flowEnabled,
        // Mouse interaction
        mouseDistortionStrength,
        mouseDistortionRadius,
        mouseDecayRate,
        mouseDarken,
        // Texture generation
        enableProceduralTexture,
        textureVoidLikelihood,
        textureVoidWidthMin,
        textureVoidWidthMax,
        textureBandDensity,
        textureColorBlending,
        textureSeed,
        proceduralBackgroundColor,
        textureShapeTriangles,
        textureShapeCircles,
        textureShapeBars,
        textureShapeSquiggles,
    };

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

    return (
        <div ref={editorContainerRef} className="relative w-full h-full overflow-hidden">
            {/* Fullscreen gradient canvas */}
            <div className="fixed w-full h-full top-0 right-0 z-0">
                <canvas style={{ height: "100%", width: "100%" }} ref={canvasRef} />
            </div>

            {/* Main scrollable content area; we give it min-h-screen and extra padding bottom
                so there is meaningful scroll range. Its scrollTop is mapped to yOffset. */}
            <div
                ref={scrollContentRef}
                className="neat-scroll-content relative z-10 h-full overflow-y-auto"
            >
                {/* Invisible spacer to create actual scrollable height */}
                <div style={{ height: "300vh", pointerEvents: "none" }} />

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
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 bg-black/35 text-white backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg">
                        <Tooltip title="Previous preset (←)">
                            <IconButton className="text-inherit"
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
                                        onClick={nextPreset}>
                                <ChevronRight className="w-5 h-5"/>
                            </IconButton>
                        </Tooltip>
                        <div className="w-px h-7 mx-1 bg-white/20"/>
                        <Button size="sm" className="px-3 py-1"
                                onClick={() => setDrawerOpen(true)}>
                            Edit
                        </Button>
                        <div className="w-px h-7 mx-1 bg-white/20"/>
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
                                        onClick={() => gradientRef.current?.downloadAsPNG()}>
                                <Download className="w-5 h-5"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Import config">
                            <IconButton className="text-inherit"
                                        onClick={() => setImportDialogOpen(true)}>
                                <Import className="w-5 h-5"/>
                            </IconButton>
                        </Tooltip>
                    </div>
                )}

                {/* Quick restore when UI is hidden */}
                {!uiVisible && (
                    <div className="fixed bottom-4 right-4 z-20">
                        <Button size="sm" variant="outline"
                                className="px-3 py-1 bg-white/70"
                                onClick={() => setUiVisible(true)}>
                            Show UI
                        </Button>
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
                            onClick={handleDrawerClose}
                            className="fixed left-4 top-4 bg-black/20 text-white p-2 rounded-full"
                        >
                            <ChevronLeft className="w-6 h-6"/>
                        </IconButton>

                        <div className="flex flex-col h-full gap-4">
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
                                <div className={`space-y-2 transition-opacity ${enableProceduralTexture ? 'opacity-40 pointer-events-none' : ''}`}>
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

                                {/* Waves section - disabled when speed is 0 */}
                                <div className={`space-y-2 transition-opacity ${speed === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
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

                                {/* Shape & Background section */}
                                <div className="space-y-2">
                                    <div className="font-semibold text-sm mb-2">Shape & Background</div>
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
                                        <span className="w-28 text-right pr-2 text-xs">Background</span>
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
                                                <span className="text-xs">Background Alpha</span>
                                                <Slider value={[backgroundAlpha]}
                                                        step={0.05} min={0} max={1}
                                                        onValueChange={(v) => setBackgroundAlpha(v[0] as number)}/>
                                            </div>
                                        </div>
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

                                    {/* Mouse Interaction subsection */}
                                    <div className="space-y-2 pl-2 border-l-2 border-white/20">
                                        <div className="text-xs font-semibold mb-1">Mouse Interaction</div>
                                        <div className={`space-y-2 transition-opacity ${mouseDistortionStrength === 0 ? 'opacity-60' : ''}`}>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Strength</span>
                                                <Slider
                                                    value={[mouseDistortionStrength]}
                                                    step={0.01}
                                                    min={0}
                                                    max={2.0}
                                                    onValueChange={(v) => setMouseDistortionStrength(v[0] as number)}
                                                />
                                            </div>
                                            <div className={`space-y-2 transition-opacity ${mouseDistortionStrength === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs">Radius</span>
                                                    <Slider
                                                        value={[mouseDistortionRadius]}
                                                        step={0.01}
                                                        min={0.05}
                                                        max={2.0}
                                                        disabled={mouseDistortionStrength === 0}
                                                        onValueChange={(v) => setMouseDistortionRadius(v[0] as number)}
                                                    />
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs">Decay Rate</span>
                                                    <Slider
                                                        value={[mouseDecayRate]}
                                                        step={0.001}
                                                        min={0.90}
                                                        max={0.99}
                                                        disabled={mouseDistortionStrength === 0}
                                                        onValueChange={(v) => setMouseDecayRate(v[0] as number)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={"pb-4 px-4"}>
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
            </div>
        </div>
    );
}
