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
import { ChevronLeft, ChevronRight, Download, Import, Video, Square, Sparkles, Plus, Trash2, Upload, Palette, Box, Wind, Sliders, Image, RotateCcw, Camera, Lock, Unlock, Minus } from "lucide-react";
import { ColorSwatch } from "./ColorSwatch";
import { fontMap, NEAT_PRESET, PRESETS } from "./presets";
import { getComplementaryColor, isDarkColor, hslToHex, extractColorsFromImage } from "../utils/colors";
import { GetCodeDialog } from "./GetCodeDialog";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "./ui/dialog";
import { Analytics } from "@firebase/analytics";
import { logEvent } from "firebase/analytics";
import { NeatColor, NeatConfig, NeatGradient } from "@firecms/neat"; // Ensure this matches your local link
import { ImportConfigDialog } from "./ImportConfigDialog";
import { LicenseDialog } from "./LicenseDialog";
import { downloadCanvasAsPNG, recordCanvasVideo } from "../utils/canvas-export";
import { trackCheckoutCancelled } from "../utils/analytics";

// Algorithmic smart palette generator — infinite variety with color theory rules per archetype
function generateSmartPalette(archetype: string): { colors: string[], background: string } {
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;
    const baseHue = Math.random() * 360;

    if (archetype === "flow") {
        // Analogous harmony: colors within ±50° of base, soft & luminous
        const spread = rand(30, 50);
        const colors = [
            hslToHex(baseHue, rand(55, 80), rand(60, 78)),
            hslToHex((baseHue + spread) % 360, rand(50, 75), rand(58, 75)),
            hslToHex((baseHue - spread + 360) % 360, rand(45, 70), rand(62, 80)),
            hslToHex((baseHue + spread * 1.5) % 360, rand(35, 60), rand(70, 85)),
            "#FFFFFF",
        ];
        return { colors, background: hslToHex(baseHue, rand(30, 55), rand(6, 13)) };
    }

    if (archetype === "cyber") {
        // Complementary/triadic: 2-3 vivid hues far apart, neon on black
        const h2 = (baseHue + rand(110, 180)) % 360;
        const h3 = (baseHue + rand(200, 280)) % 360;
        const colors = [
            hslToHex(baseHue, rand(85, 100), rand(50, 65)),
            hslToHex(h2, rand(85, 100), rand(50, 65)),
            hslToHex(h3, rand(80, 100), rand(45, 60)),
            hslToHex((baseHue + 30) % 360, rand(70, 95), rand(30, 50)),
            hslToHex(h2, rand(60, 80), rand(70, 85)),
        ];
        return { colors, background: hslToHex(baseHue, rand(40, 70), rand(2, 6)) };
    }

    if (archetype === "textured") {
        // Warm analogous, muted & earthy — hue biased towards warm range
        const warmHue = rand(10, 55); // orange-amber range
        const spread = rand(15, 30);
        const colors = [
            hslToHex(warmHue, rand(35, 60), rand(40, 58)),
            hslToHex((warmHue + spread) % 360, rand(30, 55), rand(45, 62)),
            hslToHex((warmHue - spread + 360) % 360, rand(25, 50), rand(50, 68)),
            hslToHex((warmHue + spread * 2) % 360, rand(20, 45), rand(35, 50)),
            hslToHex(warmHue, rand(15, 35), rand(70, 85)),
        ];
        return { colors, background: hslToHex(warmHue, rand(25, 50), rand(4, 9)) };
    }

    if (archetype === "iridescent") {
        // Pastel spectrum: light colors spread across the hue wheel
        const offset = rand(60, 100);
        const colors = [
            hslToHex(baseHue, rand(35, 55), rand(80, 90)),
            hslToHex((baseHue + offset) % 360, rand(40, 60), rand(78, 88)),
            hslToHex((baseHue + offset * 2) % 360, rand(35, 55), rand(80, 90)),
            hslToHex((baseHue + offset * 3) % 360, rand(30, 50), rand(75, 88)),
            "#FFFFFF",
        ];
        return { colors, background: hslToHex((baseHue + 180) % 360, rand(20, 40), rand(5, 9)) };
    }

    // wireframe — monochrome + optional accent
    const useDarkBg = Math.random() < 0.7;
    if (useDarkBg) {
        const accentHue = baseHue;
        const colors = [
            hslToHex(accentHue, rand(60, 90), rand(55, 70)),
            hslToHex((accentHue + 30) % 360, rand(50, 80), rand(50, 65)),
            hslToHex(accentHue, rand(10, 25), rand(30, 45)),
            hslToHex(accentHue, rand(5, 15), rand(55, 70)),
            hslToHex(accentHue, rand(15, 30), rand(75, 88)),
        ];
        return { colors, background: hslToHex(accentHue, rand(15, 35), rand(3, 7)) };
    } else {
        const accentHue = baseHue;
        const colors = [
            hslToHex(accentHue, rand(40, 70), rand(35, 50)),
            hslToHex((accentHue + 20) % 360, rand(30, 55), rand(40, 55)),
            hslToHex(0, 0, rand(25, 40)),
            hslToHex(0, 0, rand(45, 60)),
            hslToHex(0, 0, rand(65, 80)),
        ];
        return { colors, background: hslToHex(0, 0, rand(95, 100)) };
    }
}

const ARCHETYPES = ["flow", "cyber", "textured", "iridescent", "wireframe"];

function generateSmartConfig(archetype: string): NeatConfig {
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const randomInt = (min: number, max: number) => Math.floor(randomInRange(min, max + 1));
    
    // 1. Generate a smart palette using color theory rules for this archetype
    const palette = generateSmartPalette(archetype);
    
    const colors: NeatColor[] = palette.colors.map((c, i) => ({
        color: c,
        enabled: i < 4 // enable exactly 4 colors, keep the 5th optional
    }));
    
    // Fill remaining colors as disabled to keep exactly 6 colors in array
    while (colors.length < 6) {
        colors.push({ color: "#FFFFFF", enabled: false });
    }

    let backgroundColor = palette.background;
    
    // General smart bounds that apply unless overridden
    let speed = randomInRange(1.5, 3.5);
    let colorBlending = randomInRange(5, 8);
    let horizontalPressure = randomInRange(3, 7);
    let verticalPressure = randomInRange(3, 7);
    let shadows = randomInRange(1, 6);
    let highlights = randomInRange(3, 8);
    let colorSaturation = randomInRange(0, 3);
    let colorBrightness = randomInRange(0.9, 1.15);
    let waveFrequencyX = randomInRange(2, 6);
    let waveFrequencyY = randomInRange(2, 6);
    let waveAmplitude = randomInRange(2, 6);
    let backgroundAlpha = randomInRange(0.9, 1.0);
    let grainIntensity = randomInRange(0.05, 0.25);
    let grainScale = randomInRange(1, 4);
    let grainSparsity = 0;
    let grainSpeed = randomInRange(0.1, 0.4);
    let resolution = randomInRange(0.7, 1.25);
    let yOffset = randomInRange(0, 10000);
    
    let yOffsetWaveMultiplier = randomInRange(3, 6);
    let yOffsetColorMultiplier = randomInRange(3, 6);
    let yOffsetFlowMultiplier = randomInRange(3, 6);
    
    let flowEnabled = Math.random() < 0.5;
    let flowDistortionA = randomInRange(0.5, 2.5);
    let flowDistortionB = randomInRange(1, 5);
    let flowScale = randomInRange(1, 3);
    let flowEase = randomInRange(0.1, 0.5);
    
    let enableProceduralTexture = false;
    let transparentTextureVoid = false;
    let textureVoidLikelihood = randomInRange(0.2, 0.45);
    let textureVoidWidthMin = randomInRange(50, 150);
    let textureVoidWidthMax = randomInRange(200, 450);
    let textureBandDensity = randomInRange(1.0, 2.5);
    let textureColorBlending = randomInRange(0.01, 0.05);
    let textureSeed = randomInt(1, 9999);
    let textureEase = randomInRange(0.3, 0.7);
    let proceduralBackgroundColor = backgroundColor;
    let textureShapeTriangles = randomInt(10, 30);
    let textureShapeCircles = randomInt(5, 20);
    let textureShapeBars = randomInt(5, 20);
    let textureShapeSquiggles = randomInt(5, 15);
    
    let domainWarpEnabled = Math.random() < 0.3;
    let domainWarpIntensity = randomInRange(0.1, 0.5);
    let domainWarpScale = randomInRange(2.0, 4.0);
    let vignetteIntensity = randomInRange(0.1, 0.5);
    let vignetteRadius = randomInRange(0.6, 0.95);
    let fresnelEnabled = Math.random() < 0.4;
    let fresnelPower = randomInRange(1.5, 3.5);
    let fresnelIntensity = randomInRange(0.3, 1.2);
    let fresnelColor = colors[0].color;
    let iridescenceEnabled = false;
    let iridescenceIntensity = randomInRange(0.2, 0.6);
    let iridescenceSpeed = randomInRange(0.5, 2.0);
    let bloomIntensity = 0;
    let bloomThreshold = randomInRange(0.7, 0.9);
    let chromaticAberration = 0;
    
    // Cross-theme wireframe: rare 5% chance for non-wireframe themes
    let wireframe = archetype === "wireframe" || (Math.random() < 0.05);

    // Apply specific archetype parameters (which overwrite defaults)
    if (archetype === "flow") {
        speed = randomInRange(0.6, 1.8);
        colorBlending = randomInRange(7.0, 10.0);
        horizontalPressure = randomInRange(3, 6);
        verticalPressure = randomInRange(3, 6);
        waveFrequencyX = randomInRange(1, 3.0);
        waveFrequencyY = randomInRange(1, 3.0);
        waveAmplitude = randomInRange(3, 7);
        colorSaturation = randomInRange(0.5, 4.5);
        colorBrightness = randomInRange(0.95, 1.15);
        
        yOffsetWaveMultiplier = randomInRange(2.0, 4.5);
        yOffsetColorMultiplier = randomInRange(2.0, 4.5);
        
        vignetteIntensity = randomInRange(0.25, 0.55);
        vignetteRadius = randomInRange(0.55, 0.85);
        
        grainIntensity = randomInRange(0.01, 0.06);
        grainScale = 1;
        grainSpeed = 0.05;
        
        flowEnabled = Math.random() < 0.6;
        if (flowEnabled) {
            flowDistortionA = randomInRange(0.2, 1.0);
            flowDistortionB = randomInRange(0.4, 1.8);
            flowScale = randomInRange(1, 2);
            flowEase = randomInRange(0.1, 0.35);
        }
        
        if (Math.random() < 0.4) {
            bloomIntensity = randomInRange(0.3, 0.8);
            bloomThreshold = randomInRange(0.75, 0.9);
        }
    } 
    else if (archetype === "cyber") {
        speed = randomInRange(3.5, 6.5);
        colorBlending = randomInRange(3.5, 6.0);
        horizontalPressure = randomInRange(5, 9);
        verticalPressure = randomInRange(5, 9);
        waveFrequencyX = randomInRange(4, 8.5);
        waveFrequencyY = randomInRange(4, 8.5);
        waveAmplitude = randomInRange(5.5, 9.0);
        colorSaturation = randomInRange(3, 8);
        colorBrightness = randomInRange(1.0, 1.25);
        
        yOffsetWaveMultiplier = randomInRange(5.5, 9.0);
        yOffsetColorMultiplier = randomInRange(5.5, 9.0);
        yOffsetFlowMultiplier = randomInRange(5.5, 9.0);
        
        backgroundColor = Math.random() < 0.7 ? "#000000" : "#02000a";
        
        bloomIntensity = randomInRange(1.0, 2.4);
        bloomThreshold = randomInRange(0.4, 0.65);
        fresnelEnabled = true;
        fresnelIntensity = randomInRange(1.2, 2.8);
        fresnelPower = randomInRange(1.5, 3.0);
        fresnelColor = colors[Math.floor(Math.random() * 3)].color;
        
        chromaticAberration = randomInRange(5, 16);
        domainWarpEnabled = Math.random() < 0.75;
        if (domainWarpEnabled) {
            domainWarpIntensity = randomInRange(0.5, 1.3);
            domainWarpScale = randomInRange(2.0, 4.0);
        }
        flowEnabled = true;
        flowDistortionA = randomInRange(2.0, 4.5);
        flowDistortionB = randomInRange(3.0, 6.5);
    }
    else if (archetype === "textured") {
        speed = randomInRange(0.1, 0.5);
        colorBlending = randomInRange(2.5, 5.0);
        waveFrequencyX = randomInRange(2.5, 5.5);
        waveFrequencyY = randomInRange(2.5, 5.5);
        waveAmplitude = randomInRange(2.0, 5.0);
        colorSaturation = randomInRange(-2.0, 1.0);
        colorBrightness = randomInRange(0.9, 1.05);
        
        enableProceduralTexture = true;
        textureVoidLikelihood = randomInRange(0.15, 0.45);
        textureBandDensity = randomInRange(0.5, 2.5);
        textureEase = randomInRange(0.7, 0.97);
        proceduralBackgroundColor = backgroundColor;
        
        grainIntensity = randomInRange(0.2, 0.5);
        grainScale = randomInRange(2.0, 5.0);
        grainSpeed = randomInRange(0.02, 0.12);
        
        textureShapeTriangles = randomInt(20, 50);
        textureShapeCircles = randomInt(10, 35);
        textureShapeBars = randomInt(10, 30);
        textureShapeSquiggles = randomInt(5, 20);
        
        vignetteIntensity = randomInRange(0.4, 0.75);
    }
    else if (archetype === "iridescent") {
        speed = randomInRange(1.6, 3.8);
        colorBlending = randomInRange(6.0, 8.5);
        waveFrequencyX = randomInRange(3.0, 6.0);
        waveFrequencyY = randomInRange(3.0, 6.0);
        waveAmplitude = randomInRange(3.0, 6.5);
        colorSaturation = randomInRange(-3.0, 0);
        colorBrightness = randomInRange(1.0, 1.15);
        
        iridescenceEnabled = true;
        iridescenceIntensity = randomInRange(0.7, 1.0);
        iridescenceSpeed = randomInRange(1.5, 3.5);
        fresnelEnabled = true;
        fresnelIntensity = randomInRange(1.2, 2.5);
        fresnelPower = randomInRange(1.8, 3.5);
        fresnelColor = "#FFFFFF";
        
        bloomIntensity = randomInRange(0.4, 1.1);
        chromaticAberration = randomInRange(2, 7);
        
        domainWarpEnabled = Math.random() < 0.6;
        if (domainWarpEnabled) {
            domainWarpIntensity = randomInRange(0.2, 0.6);
        }
    }
    else {
        // wireframe theme
        wireframe = true;
        speed = randomInRange(1.2, 3.5);
        colorBlending = randomInRange(4.0, 7.5);
        waveFrequencyX = randomInRange(2.5, 6.5);
        waveFrequencyY = randomInRange(2.5, 6.5);
        waveAmplitude = randomInRange(4.5, 9.0);
        
        const isDark = Math.random() < 0.7;
        if (isDark) {
            backgroundColor = Math.random() < 0.5 ? "#000000" : (palette.background || "#050510");
            colorSaturation = randomInRange(2.0, 6.0);
            colorBrightness = randomInRange(1.0, 1.35);
            bloomIntensity = randomInRange(0.8, 2.0);
            fresnelIntensity = randomInRange(1.2, 2.6);
            chromaticAberration = randomInRange(3, 14);
        } else {
            backgroundColor = Math.random() < 0.5 ? "#FFFFFF" : "#F8FAFC";
            colorSaturation = randomInRange(-1.0, 2.0);
            colorBrightness = randomInRange(0.55, 0.8);
            bloomIntensity = 0;
            fresnelIntensity = 0.5;
            chromaticAberration = randomInRange(0, 3);
        }
        
        fresnelEnabled = true;
        fresnelPower = randomInRange(1.5, 3.0);
        fresnelColor = isDark ? colors[Math.floor(Math.random() * 3)].color : "#1e293b";
        
        resolution = randomInRange(0.3, 0.8);
        
        domainWarpEnabled = Math.random() < 0.6;
        if (domainWarpEnabled) {
            domainWarpIntensity = randomInRange(0.3, 0.8);
        }
    }
    
    return {
        colors,
        speed,
        colorBlending,
        horizontalPressure,
        verticalPressure,
        shadows,
        highlights,
        colorSaturation,
        colorBrightness,
        waveFrequencyX,
        waveFrequencyY,
        waveAmplitude,
        backgroundAlpha,
        backgroundColor,
        grainIntensity,
        grainScale,
        grainSparsity,
        grainSpeed,
        resolution,
        yOffset,
        yOffsetWaveMultiplier,
        yOffsetColorMultiplier,
        yOffsetFlowMultiplier,
        flowEnabled,
        flowDistortionA,
        flowDistortionB,
        flowScale,
        flowEase,
        enableProceduralTexture,
        transparentTextureVoid,
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
        wireframe
    };
}

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
    const [recordFormat, setRecordFormat] = React.useState<'mp4' | 'webm'>('mp4');
    const stopRecordingRef = React.useRef<(() => void) | null>(null);
    const [licenseDialogOpen, setLicenseDialogOpen] = React.useState(false);

    // Custom states for smart randomize and image drop color extractor
    const [randomPresetConfig, setRandomPresetConfig] = React.useState<NeatConfig | null>(null);
    const [dragActive, setDragActive] = React.useState<boolean>(false);
    const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [selectedArchetype, setSelectedArchetype] = React.useState<string>("random");

    // Detect return from Stripe after cancellation
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("checkout_cancelled") === "1") {
            trackCheckoutCancelled();
            // Clean up URL without reload
            const url = new URL(window.location.href);
            url.searchParams.delete("checkout_cancelled");
            window.history.replaceState({}, "", url.pathname + url.search);
        }
    }, []);

    const allPresets = React.useMemo(() => {
        const base = { ...PRESETS };
        if (randomPresetConfig) {
            // @ts-ignore
            base["Random"] = randomPresetConfig;
        }
        return base as Record<string, NeatConfig>;
    }, [randomPresetConfig]);

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
            if (drawerOpen || dialogOpen || importDialogOpen || recordDialogOpen || licenseDialogOpen) {
                closingViaBackButton.current = true;
                if (drawerOpen) setDrawerOpen(false);
                if (dialogOpen) setDialogOpen(false);
                if (importDialogOpen) setImportDialogOpen(false);
                if (recordDialogOpen && !isRecording) setRecordDialogOpen(false);
                if (licenseDialogOpen) setLicenseDialogOpen(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [drawerOpen, dialogOpen, importDialogOpen, recordDialogOpen, licenseDialogOpen, isRecording]);

    // Push history state when opening dialogs/drawer
    useEffect(() => {
        if (drawerOpen || dialogOpen || importDialogOpen || recordDialogOpen || licenseDialogOpen) {
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
    }, [drawerOpen, dialogOpen, importDialogOpen, recordDialogOpen, licenseDialogOpen]);

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
        setTransparentTextureVoid(config.transparentTextureVoid ?? false);
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
        setSilhouetteFade(config.silhouetteFade ?? 0.25);
        setCylinderFade(config.cylinderFade ?? 0.08);
        setRibbonFade(config.ribbonFade ?? 0.05);
        setFlatShading(config.flatShading ?? true);

        // 3D Shapes config setters
        setShapeType(config.shapeType ?? 'plane');
        setShapeRotationX(config.shapeRotationX ?? 0);
        setShapeRotationY(config.shapeRotationY ?? 0);
        setShapeRotationZ(config.shapeRotationZ ?? 0);
        setShapeAutoRotateSpeedX(config.shapeAutoRotateSpeedX ?? 0);
        setShapeAutoRotateSpeedY(config.shapeAutoRotateSpeedY ?? 0);
        setSphereRadius(config.sphereRadius ?? 15);
        setTorusRadius(config.torusRadius ?? 15);
        setTorusTube(config.torusTube ?? 5);
        setCylinderRadius(config.cylinderRadius ?? 10);
        setCylinderHeight(config.cylinderHeight ?? 40);
        setPlaneBend(config.planeBend ?? 0);
        setPlaneTwist(config.planeTwist ?? 0);

        // Camera config setters
        setCameraLock(config.cameraLock ?? false);
        setCameraX(config.cameraX ?? 0);
        setCameraY(config.cameraY ?? 0);
        setCameraZ(config.cameraZ ?? 0);
        setCameraRotationX(config.cameraRotationX ?? 0);
        setCameraRotationY(config.cameraRotationY ?? 0);
        setCameraRotationZ(config.cameraRotationZ ?? 0);
        setCameraZoom(config.cameraZoom ?? 1.0);
    }

    const [selectedPreset, setSelectedPreset] = React.useState<string>("Neat");
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
    const [transparentTextureVoid, setTransparentTextureVoid] = React.useState<boolean>(defaultConfig.transparentTextureVoid ?? false);
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

    const [silhouetteFade, setSilhouetteFade] = React.useState<number>(defaultConfig.silhouetteFade ?? 0.25);
    const [cylinderFade, setCylinderFade] = React.useState<number>(defaultConfig.cylinderFade ?? 0.08);
    const [ribbonFade, setRibbonFade] = React.useState<number>(defaultConfig.ribbonFade ?? 0.05);
    const [flatShading, setFlatShading] = React.useState<boolean>(defaultConfig.flatShading ?? true);

    // === Shape state ===
    const [shapeType, setShapeType] = React.useState<'plane' | 'sphere' | 'torus' | 'cylinder' | 'ribbon'>(defaultConfig.shapeType ?? 'plane');
    const [shapeRotationX, setShapeRotationX] = React.useState<number>(defaultConfig.shapeRotationX ?? 0);
    const [shapeRotationY, setShapeRotationY] = React.useState<number>(defaultConfig.shapeRotationY ?? 0);
    const [shapeRotationZ, setShapeRotationZ] = React.useState<number>(defaultConfig.shapeRotationZ ?? 0);
    const [shapeAutoRotateSpeedX, setShapeAutoRotateSpeedX] = React.useState<number>(defaultConfig.shapeAutoRotateSpeedX ?? 0);
    const [shapeAutoRotateSpeedY, setShapeAutoRotateSpeedY] = React.useState<number>(defaultConfig.shapeAutoRotateSpeedY ?? 0);
    const [sphereRadius, setSphereRadius] = React.useState<number>(defaultConfig.sphereRadius ?? 15);
    const [torusRadius, setTorusRadius] = React.useState<number>(defaultConfig.torusRadius ?? 15);
    const [torusTube, setTorusTube] = React.useState<number>(defaultConfig.torusTube ?? 5);
    const [cylinderRadius, setCylinderRadius] = React.useState<number>(defaultConfig.cylinderRadius ?? 10);
    const [cylinderHeight, setCylinderHeight] = React.useState<number>(defaultConfig.cylinderHeight ?? 40);
    const [planeBend, setPlaneBend] = React.useState<number>(defaultConfig.planeBend ?? 0);
    const [planeTwist, setPlaneTwist] = React.useState<number>(defaultConfig.planeTwist ?? 0);

    // === Camera state ===
    const [cameraLock, setCameraLock] = React.useState<boolean>(defaultConfig.cameraLock ?? false);
    const [cameraX, setCameraX] = React.useState<number>(defaultConfig.cameraX ?? 0);
    const [cameraY, setCameraY] = React.useState<number>(defaultConfig.cameraY ?? 0);
    const [cameraZ, setCameraZ] = React.useState<number>(defaultConfig.cameraZ ?? 0);
    const [cameraRotationX, setCameraRotationX] = React.useState<number>(defaultConfig.cameraRotationX ?? 0);
    const [cameraRotationY, setCameraRotationY] = React.useState<number>(defaultConfig.cameraRotationY ?? 0);
    const [cameraRotationZ, setCameraRotationZ] = React.useState<number>(defaultConfig.cameraRotationZ ?? 0);
    const [cameraZoom, setCameraZoom] = React.useState<number>(defaultConfig.cameraZoom ?? 1.0);

    const resetCamera = React.useCallback(() => {
        setCameraX(0);
        setCameraY(0);
        setCameraZ(0);
        setCameraRotationX(0);
        setCameraRotationY(0);
        setCameraRotationZ(0);
        setCameraZoom(1.0);
    }, []);

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
            transparentTextureVoid,
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

            silhouetteFade,
            cylinderFade,
            ribbonFade,
            flatShading,

            // Shapes parameters
            shapeType,
            shapeRotationX,
            shapeRotationY,
            shapeRotationZ,
            shapeAutoRotateSpeedX,
            shapeAutoRotateSpeedY,
            sphereRadius,
            torusRadius,
            torusTube,
            cylinderRadius,
            cylinderHeight,
            planeBend,
            planeTwist,

            // Camera parameters
            cameraLock,
            cameraX,
            cameraY,
            cameraZ,
            cameraRotationX,
            cameraRotationY,
            cameraRotationZ,
            cameraZoom,
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
        gradientRef.current.transparentTextureVoid = transparentTextureVoid;
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
        gradientRef.current.silhouetteFade = silhouetteFade;
        gradientRef.current.cylinderFade = cylinderFade;
        gradientRef.current.ribbonFade = ribbonFade;
        gradientRef.current.flatShading = flatShading;

        // Shape properties
        gradientRef.current.shapeType = shapeType;
        gradientRef.current.shapeRotationX = shapeRotationX;
        gradientRef.current.shapeRotationY = shapeRotationY;
        gradientRef.current.shapeRotationZ = shapeRotationZ;
        gradientRef.current.shapeAutoRotateSpeedX = shapeAutoRotateSpeedX;
        gradientRef.current.shapeAutoRotateSpeedY = shapeAutoRotateSpeedY;
        gradientRef.current.sphereRadius = sphereRadius;
        gradientRef.current.torusRadius = torusRadius;
        gradientRef.current.torusTube = torusTube;
        gradientRef.current.cylinderRadius = cylinderRadius;
        gradientRef.current.cylinderHeight = cylinderHeight;
        gradientRef.current.planeBend = planeBend;
        gradientRef.current.planeTwist = planeTwist;

        // Camera properties
        // @ts-ignore
        gradientRef.current.cameraLock = cameraLock;
        // @ts-ignore
        gradientRef.current.cameraX = cameraX;
        // @ts-ignore
        gradientRef.current.cameraY = cameraY;
        // @ts-ignore
        gradientRef.current.cameraZ = cameraZ;
        // @ts-ignore
        gradientRef.current.cameraRotationX = cameraRotationX;
        // @ts-ignore
        gradientRef.current.cameraRotationY = cameraRotationY;
        // @ts-ignore
        gradientRef.current.cameraRotationZ = cameraRotationZ;
        // @ts-ignore
        gradientRef.current.cameraZoom = cameraZoom;
    }, [
        tweened,
        colors,
        backgroundColor,
        wireframe,
        // yOffset removed
        enableProceduralTexture,
        proceduralBackgroundColor,
        transparentTextureVoid,
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

        // Shape state dependencies
        shapeType,
        shapeRotationX,
        shapeRotationY,
        shapeRotationZ,
        shapeAutoRotateSpeedX,
        shapeAutoRotateSpeedY,
        sphereRadius,
        torusRadius,
        torusTube,
        cylinderRadius,
        cylinderHeight,
        planeBend,
        planeTwist,
        silhouetteFade,
        cylinderFade,
        ribbonFade,
        flatShading,

        cameraLock,
        cameraX,
        cameraY,
        cameraZ,
        cameraRotationX,
        cameraRotationY,
        cameraRotationZ,
        cameraZoom,
    ]);

    // Mouse drag-to-rotate interaction for 3D shapes
    const isDraggingRotation = React.useRef(false);
    const dragStartPos = React.useRef({ x: 0, y: 0 });
    const dragStartRotation = React.useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleStart = (clientX: number, clientY: number, target: HTMLElement) => {
            if (cameraLock) return;
            // Check if click target is inside a sidebar or dialog
            if (target.closest('.neat-sidebar') || target.closest('[role="dialog"]') || target.closest('button') || target.closest('input') || target.closest('select')) {
                return;
            }
            
            isDraggingRotation.current = true;
            dragStartPos.current = { x: clientX, y: clientY };
            dragStartRotation.current = { x: cameraRotationX, y: cameraRotationY };
        };

        const handleMove = (clientX: number, clientY: number) => {
            if (cameraLock) return;
            if (!isDraggingRotation.current) return;
            
            const dx = clientX - dragStartPos.current.x;
            const dy = clientY - dragStartPos.current.y;
            
            // Adjust rotation sensitivity
            const sensitivity = 0.007;
            setCameraRotationY(dragStartRotation.current.y + dx * sensitivity);
            setCameraRotationX(dragStartRotation.current.x + dy * sensitivity);
        };

        const handleEnd = () => {
            isDraggingRotation.current = false;
        };

        const handleMouseDown = (e: MouseEvent) => {
            handleStart(e.clientX, e.clientY, e.target as HTMLElement);
        };

        const handleMouseMove = (e: MouseEvent) => {
            handleMove(e.clientX, e.clientY);
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target as HTMLElement);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [cameraLock, cameraRotationX, cameraRotationY]);



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
        if (!canvasRef.current || isRecording) return;
        setIsRecording(true);
        setRecordingProgress(0);
        logEvent(analytics, 'record_video', { duration: recordDuration, resolution: recordResolution, format: recordFormat });

        // Determine target dimensions
        let width: number | undefined;
        let height: number | undefined;
        if (recordResolution === '720p') { width = 1280; height = 720; }
        else if (recordResolution === '1080p') { width = 1920; height = 1080; }
        else if (recordResolution === '4k') { width = 3840; height = 2160; }
        // 'current' → undefined, uses canvas size

        const stop = recordCanvasVideo(canvasRef.current, {
            durationMs: recordDuration * 1000,
            filename: 'neat.firecms.co',
            width,
            height,
            format: recordFormat,
            onProgress: (p) => setRecordingProgress(p),
            onComplete: () => {
                setIsRecording(false);
                setRecordingProgress(0);
                stopRecordingRef.current = null;
            },
        });
        stopRecordingRef.current = stop;
    }, [analytics, recordDuration, recordResolution, recordFormat, isRecording]);

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
        transparentTextureVoid,
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

        // Shape properties
        shapeType,
        shapeRotationX,
        shapeRotationY,
        shapeRotationZ,
        shapeAutoRotateSpeedX,
        shapeAutoRotateSpeedY,
        sphereRadius,
        torusRadius,
        torusTube,
        cylinderRadius,
        cylinderHeight,
        planeBend,
        planeTwist,
        silhouetteFade,
        cylinderFade,
        ribbonFade,
        flatShading,

        // Camera settings
        cameraLock,
        cameraX,
        cameraY,
        cameraZ,
        cameraRotationX,
        cameraRotationY,
        cameraRotationZ,
        cameraZoom,
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

    // Toast notification auto-dismissal
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3500);
            return () => clearTimeout(timer);
        }
        return;
    }, [toast]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        }
    };

    const handleDragLeaveOverlay = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const processImageFile = async (file: File) => {
        try {
            setToast({ message: "Extracting colors from image...", type: 'success' });
            const extracted = await extractColorsFromImage(file);
            if (extracted && extracted.length >= 5) {
                // Update first 5 colors, disable 6th
                const nextColors = colors.map((col, idx) => {
                    if (idx < 5) {
                        return { color: extracted[idx], enabled: true };
                    } else {
                        return { ...col, enabled: false };
                    }
                });
                setColors(nextColors);
                setToast({ message: "Successfully extracted 5 colors from image!", type: 'success' });
            }
        } catch (err: any) {
            setToast({ message: err.message || "Failed to extract colors", type: 'error' });
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
                await processImageFile(file);
            } else {
                setToast({ message: "Only image files are supported", type: 'error' });
            }
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processImageFile(e.target.files[0]);
        }
    };

    const handleSmartRandomize = (archetype?: string) => {
        const arch = archetype || ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
        const newConfig = generateSmartConfig(arch);
        
        setRandomPresetConfig(newConfig);
        setPreset("Random", newConfig);
        
        setToast({ message: `Generated ${arch} theme`, type: 'success' });
    };

    function setPreset(preset: string, customConfig?: NeatConfig) {
        const targetConfig = customConfig || allPresets[preset];
        if (targetConfig) {
            setSelectedPreset(preset);
            updatePresetConfig(targetConfig);
        }
    }

    const fontClass = fontMap[selectedPreset as keyof typeof fontMap] || 'font-sans';

    const prevPreset = () => {
        const keys = Object.keys(allPresets);
        const currentIndex = keys.indexOf(selectedPreset);
        const nextIndex = (currentIndex - 1 + keys.length) % keys.length;
        setPreset(keys[nextIndex]);
    };
    const nextPreset = () => {
        const keys = Object.keys(allPresets);
        const currentIndex = keys.indexOf(selectedPreset);
        const nextIndex = (currentIndex + 1) % keys.length;
        setPreset(keys[nextIndex]);
    };

    // Keyboard shortcuts: arrows for presets, 'c' to toggle controls, 'h' to toggle UI
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore keydown events if user is typing in input or textarea
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }
            if (event.key === "ArrowRight") nextPreset();
            else if (event.key === "ArrowLeft") prevPreset();
            else if (event.key.toLowerCase() === 'c') setDrawerOpen((v) => !v);
            else if (event.key.toLowerCase() === 'h') setUiVisible((v) => !v);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPreset, allPresets]);

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
    }, [selectedPreset, analytics]);

    return (
        <div 
            ref={editorContainerRef} 
            className="relative w-full h-screen"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
        >
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

                {/* Floating camera controls bar (shown only when UI is visible) */}
                {uiVisible && (
                    <div className="fixed bottom-[135px] sm:bottom-20 left-1/2 -translate-x-1/2 z-20 bg-black/25 text-white backdrop-blur-md rounded-full px-3 py-1 shadow-lg max-w-[95vw] flex items-center gap-2 text-xs select-none border border-white/5">
                        <div className="flex items-center gap-1 text-neutral-400 border-r border-white/10 pr-2 h-7">
                            <Camera className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Camera</span>
                        </div>
                        
                        <Tooltip title={cameraLock ? "Unlock Camera" : "Lock Camera"}>
                            <IconButton
                                onClick={() => setCameraLock(!cameraLock)}
                                className="text-neutral-300 hover:text-white w-7 h-7"
                            >
                                {cameraLock ? <Lock className="w-4 h-4 text-red-400/80" /> : <Unlock className="w-4 h-4" />}
                            </IconButton>
                        </Tooltip>

                        <div className="w-px h-5 bg-white/10" />

                        <Tooltip title="Reset Camera">
                            <IconButton
                                onClick={resetCamera}
                                disabled={cameraLock}
                                className="text-neutral-300 hover:text-white disabled:opacity-20 w-7 h-7"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </IconButton>
                        </Tooltip>

                        <div className="w-px h-5 bg-white/10" />

                        <div className="flex items-center gap-1">
                            <span className="opacity-40 text-[9px] uppercase font-bold tracking-wider">Zoom:</span>
                            <Tooltip title="Zoom Out">
                                <IconButton
                                    onClick={() => setCameraZoom(z => Math.max(0.1, z - 0.1))}
                                    disabled={cameraLock}
                                    className="text-neutral-300 hover:text-white disabled:opacity-20 w-7 h-7"
                                >
                                    <Minus className="w-4 h-4" />
                                </IconButton>
                            </Tooltip>
                            <span className="font-mono w-8 text-center text-xs text-neutral-300">{cameraZoom.toFixed(1)}x</span>
                            <Tooltip title="Zoom In">
                                <IconButton
                                    onClick={() => setCameraZoom(z => Math.min(10, z + 0.1))}
                                    disabled={cameraLock}
                                    className="text-neutral-300 hover:text-white disabled:opacity-20 w-7 h-7"
                                >
                                    <Plus className="w-4 h-4" />
                                </IconButton>
                            </Tooltip>
                        </div>

                        <div className="hidden sm:block w-px h-5 bg-white/10" />

                        <div className="hidden sm:flex w-40 text-center shrink-0 items-center justify-center h-7">
                            {cameraLock ? (
                                <span className="text-[9px] text-red-400/80 font-bold uppercase tracking-wider animate-pulse">LOCKED</span>
                            ) : (
                                <span className="text-[9px] text-neutral-400 font-medium">Drag to rotate • Scroll to animate</span>
                            )}
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
                                    {Object.keys(allPresets).map((preset) => (
                                        <SelectItem className={(fontMap[preset as keyof typeof fontMap] || "font-sans") + " "}
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
                                <Tooltip title="Smart Randomize Theme">
                                    <IconButton className="text-inherit"
                                                aria-label="Smart Randomize"
                                                onClick={() => handleSmartRandomize()}>
                                        <Sparkles className="w-5 h-5"/>
                                    </IconButton>
                                </Tooltip>
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
                                                onClick={() => canvasRef.current && downloadCanvasAsPNG(canvasRef.current)}>
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
                                <Tooltip title="Remove NEAT watermark — €12">
                                    <Button variant="text" size="sm" className="px-2 py-1 text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/10"
                                            onClick={() => {
                                                setLicenseDialogOpen(true);
                                                logEvent(analytics, 'open_license_dialog');
                                            }}>
                                        PRO
                                    </Button>
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
                        className={"w-[380px] bg-neutral-900/75 text-white backdrop-blur-md border border-white/10 h-full neat-sidebar"}
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
                                
                                {/* Section 1: Presets & Colors */}
                                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Palette className="w-4 h-4 text-pink-400" />
                                        <span className="font-bold text-sm tracking-wider uppercase text-neutral-100">Presets & Colors</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-normal">
                                        Choose a starting preset or customize the 5 gradient colors. You can also extract colors from an image.
                                    </p>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] tracking-widest font-bold uppercase opacity-70">Preset</span>
                                            <span className="text-[10px] opacity-50">← → to browse</span>
                                        </div>

                                        <Select
                                            value={selectedPreset}
                                            className={fontClass + " text-xl bg-white/10 border border-white/20 rounded-lg px-2 py-1 w-full"}
                                            onValueChange={(preset) => {
                                                logEvent(analytics, 'select_preset', { preset });
                                                setPreset(preset);
                                            }}
                                        >
                                            {Object.keys(allPresets).map((preset) => (
                                                <SelectItem
                                                    className={(fontMap[preset as keyof typeof fontMap] || "font-sans") + " "}
                                                    key={preset}
                                                    value={preset}
                                                >
                                                    {preset}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <div className="bg-white/10 border border-white/20 rounded-xl p-3">
                                            <div className="flex space-x-4 justify-evenly mt-1 mb-1">
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

                                        <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-3">
                                            <div className="font-semibold text-xs mb-1 flex items-center gap-1.5">
                                                <Upload className="w-3.5 h-3.5 text-blue-400" />
                                                <span>Image Color Extractor</span>
                                            </div>
                                            <p className="text-[11px] opacity-70">
                                                Drop an image anywhere, or select one to extract 5 dominant colors.
                                            </p>
                                            <label className="flex items-center justify-center w-full px-4 py-2 mt-1 text-xs border border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all text-neutral-200">
                                                <span className="flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Choose Image</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageSelect}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: 3D Geometry */}
                                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Box className="w-4 h-4 text-blue-400" />
                                        <span className="font-bold text-sm tracking-wider uppercase text-neutral-100">3D Geometry</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-normal">
                                        Configure the 3D shape type, resolution, mesh wireframe, positioning, manual rotations, and auto-rotation speeds.
                                    </p>

                                    <div className="space-y-3">
                                        <div className="flex flex-row gap-2 items-center">
                                            <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Shape Type</span>
                                            <select
                                                value={shapeType}
                                                onChange={(e) => setShapeType(e.target.value as any)}
                                                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white w-full"
                                            >
                                                <option value="plane">Plane</option>
                                                <option value="sphere">Sphere</option>
                                                <option value="torus">Torus</option>
                                                <option value="cylinder">Cylinder</option>
                                                <option value="ribbon">Ribbon</option>
                                            </select>
                                        </div>

                                        {/* Sphere Specific Controls */}
                                        {shapeType === 'sphere' && (
                                            <>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Radius</span>
                                                    <Slider value={[sphereRadius]} min={5} max={30} step={0.5}
                                                            onValueChange={(v) => setSphereRadius(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Fade transparency of the outer silhouette edges of 3D shapes.">
                                                        Silhouette Fade
                                                    </Tooltip>
                                                    <Slider value={[silhouetteFade]} min={0} max={1} step={0.01}
                                                            onValueChange={(v) => setSilhouetteFade(v[0] as number)}/>
                                                </div>
                                                <Label className="cursor-pointer flex items-center gap-2">
                                                    <Tooltip className="text-xs w-28 text-right cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Use the same flat wave-based shading as the plane, removing 3D lighting and silhouette transparency.">
                                                        Flat Shading
                                                    </Tooltip>
                                                    <div className={"w-full flex"}>
                                                        <Checkbox checked={flatShading}
                                                                  onChange={(checked: boolean) => setFlatShading(checked)}/>
                                                    </div>
                                                </Label>
                                            </>
                                        )}

                                        {/* Torus Specific Controls */}
                                        {shapeType === 'torus' && (
                                            <>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Radius</span>
                                                    <Slider value={[torusRadius]} min={5} max={30} step={0.5}
                                                            onValueChange={(v) => setTorusRadius(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Tube Radius</span>
                                                    <Slider value={[torusTube]} min={1} max={15} step={0.2}
                                                            onValueChange={(v) => setTorusTube(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Fade transparency of the outer silhouette edges of 3D shapes.">
                                                        Silhouette Fade
                                                    </Tooltip>
                                                    <Slider value={[silhouetteFade]} min={0} max={1} step={0.01}
                                                            onValueChange={(v) => setSilhouetteFade(v[0] as number)}/>
                                                </div>
                                                <Label className="cursor-pointer flex items-center gap-2">
                                                    <Tooltip className="text-xs w-28 text-right cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Use the same flat wave-based shading as the plane, removing 3D lighting and silhouette transparency.">
                                                        Flat Shading
                                                    </Tooltip>
                                                    <div className={"w-full flex"}>
                                                        <Checkbox checked={flatShading}
                                                                  onChange={(checked: boolean) => setFlatShading(checked)}/>
                                                    </div>
                                                </Label>
                                            </>
                                        )}

                                        {/* Cylinder Specific Controls */}
                                        {shapeType === 'cylinder' && (
                                            <>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Radius</span>
                                                    <Slider value={[cylinderRadius]} min={2} max={25} step={0.5}
                                                            onValueChange={(v) => setCylinderRadius(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Height</span>
                                                    <Slider value={[cylinderHeight]} min={10} max={60} step={1}
                                                            onValueChange={(v) => setCylinderHeight(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Fade transparency of the outer silhouette edges of 3D shapes.">
                                                        Silhouette Fade
                                                    </Tooltip>
                                                    <Slider value={[silhouetteFade]} min={0} max={1} step={0.01}
                                                            onValueChange={(v) => setSilhouetteFade(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Fade the top and bottom open ends of the cylinder.">
                                                        End Cap Fade
                                                    </Tooltip>
                                                    <Slider value={[cylinderFade]} min={0} max={0.5} step={0.01}
                                                            onValueChange={(v) => setCylinderFade(v[0] as number)}/>
                                                </div>
                                                <Label className="cursor-pointer flex items-center gap-2">
                                                    <Tooltip className="text-xs w-28 text-right cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Use the same flat wave-based shading as the plane, removing 3D lighting and silhouette transparency.">
                                                        Flat Shading
                                                    </Tooltip>
                                                    <div className={"w-full flex"}>
                                                        <Checkbox checked={flatShading}
                                                                  onChange={(checked: boolean) => setFlatShading(checked)}/>
                                                    </div>
                                                </Label>
                                            </>
                                        )}

                                        {/* Ribbon Specific Controls */}
                                        {shapeType === 'ribbon' && (
                                            <>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Bend</span>
                                                    <Slider value={[planeBend]} min={-5} max={5} step={0.1} resetValue={0}
                                                            onValueChange={(v) => setPlaneBend(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Twist</span>
                                                    <Slider value={[planeTwist]} min={-5} max={5} step={0.1} resetValue={0}
                                                            onValueChange={(v) => setPlaneTwist(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Fade transparency of the outer silhouette edges of 3D shapes.">
                                                        Silhouette Fade
                                                    </Tooltip>
                                                    <Slider value={[silhouetteFade]} min={0} max={1} step={0.01}
                                                            onValueChange={(v) => setSilhouetteFade(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Fade all 4 outer borders of the ribbon.">
                                                        Border Fade
                                                    </Tooltip>
                                                    <Slider value={[ribbonFade]} min={0} max={0.5} step={0.01}
                                                            onValueChange={(v) => setRibbonFade(v[0] as number)}/>
                                                </div>
                                                <Label className="cursor-pointer flex items-center gap-2">
                                                    <Tooltip className="text-xs w-28 text-right cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Use the same flat wave-based shading as the plane, removing 3D lighting and silhouette transparency.">
                                                        Flat Shading
                                                    </Tooltip>
                                                    <div className={"w-full flex"}>
                                                        <Checkbox checked={flatShading}
                                                                  onChange={(checked: boolean) => setFlatShading(checked)}/>
                                                    </div>
                                                </Label>
                                            </>
                                        )}

                                        {/* Resolution & Wireframe */}
                                        <div className="space-y-2 border-t border-white/5 pt-2">
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="The density of triangles in the 3D mesh. Reduce to increase performance.">
                                                    Resolution
                                                </Tooltip>
                                                <Slider value={[resolution]} step={0.05}
                                                        min={0.05} max={2}
                                                        onValueChange={(v) => setResolution(v[0] as number)}/>
                                            </div>

                                            <Label className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                                <Tooltip className="text-xs w-28 text-right cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Show the underlying triangle mesh skeleton (bypasses color shader).">
                                                    Wireframe
                                                </Tooltip>
                                                <div className={"w-full flex"}>
                                                    <Checkbox checked={wireframe}
                                                              onChange={(checked: boolean) => setWireframe(checked)}/>
                                                </div>
                                            </Label>
                                            {wireframe && (
                                                <div className="text-xs opacity-70 italic mt-1 pl-2">
                                                    ℹ️ colors, grain, and textures are less visible in wireframe
                                                </div>
                                            )}
                                        </div>

                                        {/* Position & Height Multipliers */}
                                        <div className="space-y-2 border-t border-white/5 pt-2">
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Position of the shape along the vertical axis.">
                                                    Vertical Offset
                                                </Tooltip>
                                                <Slider
                                                    value={[yOffset]}
                                                    step={1}
                                                    min={0}
                                                    max={100000}
                                                    resetValue={0}
                                                    onValueChange={(v) => setYOffset(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Controls how much the 3D displacement height affects waves.">
                                                    Wave Multiplier
                                                </Tooltip>
                                                <Slider
                                                    value={[yOffsetWaveMultiplier]}
                                                    step={0.1}
                                                    min={0}
                                                    max={20}
                                                    onValueChange={(v) => setYOffsetWaveMultiplier(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Controls how much the 3D displacement height affects coloring.">
                                                    Color Multiplier
                                                </Tooltip>
                                                <Slider
                                                    value={[yOffsetColorMultiplier]}
                                                    step={0.1}
                                                    min={0}
                                                    max={20}
                                                    onValueChange={(v) => setYOffsetColorMultiplier(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Controls how much the 3D displacement height affects motion flow.">
                                                    Flow Multiplier
                                                </Tooltip>
                                                <Slider
                                                    value={[yOffsetFlowMultiplier]}
                                                    step={0.1}
                                                    min={0}
                                                    max={20}
                                                    onValueChange={(v) => setYOffsetFlowMultiplier(v[0] as number)}/>
                                            </div>
                                        </div>

                                        {/* 3D Rotations */}
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <div className="text-xs font-semibold mb-1 flex justify-between items-center">
                                                <span>Rotations</span>
                                                <button
                                                    onClick={() => {
                                                        setShapeRotationX(0);
                                                        setShapeRotationY(0);
                                                        setShapeRotationZ(0);
                                                    }}
                                                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold flex items-center gap-0.5"
                                                    title="Reset all rotations to 0"
                                                >
                                                    <RotateCcw className="w-2.5 h-2.5" /> Reset
                                                </button>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setShapeRotationX(0)}>
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Manual rotation around X axis. Double-click label or slider to reset to 0.">
                                                    Rotate X
                                                </Tooltip>
                                                <Slider value={[shapeRotationX]} min={-Math.PI} max={Math.PI} step={0.05} resetValue={0}
                                                        onValueChange={(v) => setShapeRotationX(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setShapeRotationY(0)}>
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Manual rotation around Y axis. Double-click label or slider to reset to 0.">
                                                    Rotate Y
                                                </Tooltip>
                                                <Slider value={[shapeRotationY]} min={-Math.PI} max={Math.PI} step={0.05} resetValue={0}
                                                        onValueChange={(v) => setShapeRotationY(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setShapeRotationZ(0)}>
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Manual rotation around Z axis. Double-click label or slider to reset to 0.">
                                                    Rotate Z
                                                </Tooltip>
                                                <Slider value={[shapeRotationZ]} min={-Math.PI} max={Math.PI} step={0.05} resetValue={0}
                                                        onValueChange={(v) => setShapeRotationZ(v[0] as number)}/>
                                            </div>
                                        </div>

                                        {/* Auto Rotations */}
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <div className="text-xs font-semibold mb-1 flex justify-between items-center">
                                                <span>Auto-Rotate Speed</span>
                                                <button
                                                    onClick={() => {
                                                        setShapeAutoRotateSpeedX(0);
                                                        setShapeAutoRotateSpeedY(0);
                                                    }}
                                                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold flex items-center gap-0.5"
                                                    title="Reset auto-rotation speeds to 0"
                                                >
                                                    <RotateCcw className="w-2.5 h-2.5" /> Reset
                                                </button>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setShapeAutoRotateSpeedX(0)}>
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Continuous auto-rotation speed around X axis. Double-click label or slider to reset to 0.">
                                                    X Speed
                                                </Tooltip>
                                                <Slider value={[shapeAutoRotateSpeedX]} min={-10} max={10} step={0.2} resetValue={0}
                                                        onValueChange={(v) => setShapeAutoRotateSpeedX(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setShapeAutoRotateSpeedY(0)}>
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Continuous auto-rotation speed around Y axis. Double-click label or slider to reset to 0.">
                                                    Y Speed
                                                </Tooltip>
                                                <Slider value={[shapeAutoRotateSpeedY]} min={-10} max={10} step={0.2} resetValue={0}
                                                        onValueChange={(v) => setShapeAutoRotateSpeedY(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2b: Camera Settings */}
                                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Camera className="w-4 h-4 text-blue-400" />
                                        <span className="font-bold text-sm tracking-wider uppercase text-neutral-100">Camera Controls</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-normal">
                                        Adjust the camera zoom, position, and rotation around the shape. Lock the camera to freeze view interaction.
                                    </p>

                                    <div className="space-y-3">
                                        {/* Lock toggle */}
                                        <Label className="cursor-pointer flex items-center justify-between [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800 p-1 rounded-lg">
                                            <span className="text-xs font-semibold">Lock Camera</span>
                                            <Checkbox checked={cameraLock} onChange={(checked: boolean) => setCameraLock(checked)} />
                                        </Label>

                                        {/* Action Buttons: Reset */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={resetCamera}
                                                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold flex items-center gap-0.5"
                                                title="Reset camera settings to default"
                                            >
                                                <RotateCcw className="w-2.5 h-2.5" /> Reset Camera
                                            </button>
                                        </div>

                                        {/* Camera Zoom */}
                                        <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setCameraZoom(1.0)}>
                                            <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Zoom factor. Double click to reset to 1.0.">
                                                Zoom Scale
                                            </Tooltip>
                                            <Slider value={[cameraZoom]} min={0.1} max={5} step={0.05} disabled={cameraLock}
                                                    onValueChange={(v) => setCameraZoom(v[0] as number)}/>
                                        </div>

                                        {/* Camera Displacement */}
                                        <div className="space-y-2 border-t border-white/5 pt-2">
                                            <div className="text-[10px] tracking-widest font-bold uppercase opacity-70">Displacement</div>
                                            
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setCameraX(0)}>
                                                <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Displace X</span>
                                                <Slider value={[cameraX]} min={-50} max={50} step={0.5} disabled={cameraLock} resetValue={0}
                                                        onValueChange={(v) => setCameraX(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setCameraY(0)}>
                                                <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Displace Y</span>
                                                <Slider value={[cameraY]} min={-50} max={50} step={0.5} disabled={cameraLock} resetValue={0}
                                                        onValueChange={(v) => setCameraY(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setCameraZ(0)}>
                                                <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Displace Z</span>
                                                <Slider value={[cameraZ]} min={-50} max={50} step={0.5} disabled={cameraLock} resetValue={0}
                                                        onValueChange={(v) => setCameraZ(v[0] as number)}/>
                                            </div>
                                        </div>

                                        {/* Camera Rotations */}
                                        <div className="space-y-2 border-t border-white/5 pt-2">
                                            <div className="text-[10px] tracking-widest font-bold uppercase opacity-70">Rotations</div>
                                            
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setCameraRotationX(0)}>
                                                <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Rotate Pitch</span>
                                                <Slider value={[cameraRotationX]} min={-Math.PI} max={Math.PI} step={0.05} disabled={cameraLock} resetValue={0}
                                                        onValueChange={(v) => setCameraRotationX(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setCameraRotationY(0)}>
                                                <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Rotate Yaw</span>
                                                <Slider value={[cameraRotationY]} min={-Math.PI} max={Math.PI} step={0.05} disabled={cameraLock} resetValue={0}
                                                        onValueChange={(v) => setCameraRotationY(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center" onDoubleClick={() => setCameraRotationZ(0)}>
                                                <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Rotate Roll</span>
                                                <Slider value={[cameraRotationZ]} min={-Math.PI} max={Math.PI} step={0.05} disabled={cameraLock} resetValue={0}
                                                        onValueChange={(v) => setCameraRotationZ(v[0] as number)}/>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Motion & Distortion */}
                                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Wind className="w-4 h-4 text-emerald-400" />
                                        <span className="font-bold text-sm tracking-wider uppercase text-neutral-100">Motion & Distortion</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-normal">
                                        Adjust the animation speed, base wave patterns, fluid flow fields, and curl domain warp distortions.
                                    </p>

                                    <div className="space-y-3">
                                        <div className="flex flex-row gap-2 items-center">
                                            <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Overall animation speed. If paused (0), waves and flow field simulation will freeze.">
                                                Speed
                                            </Tooltip>
                                            <Slider
                                                value={[speed]}
                                                step={0.5}
                                                min={0}
                                                max={10}
                                                onValueChange={(v) => setSpeed(v[0] as number)}
                                            />
                                        </div>
                                        {speed === 0 && (
                                            <div className="text-xs opacity-70 italic pl-2">
                                                ℹ️ Animation paused - Waves and Flow frozen
                                            </div>
                                        )}

                                        {/* Waves section */}
                                        <div className={`space-y-2 border-t border-white/5 pt-2 transition-opacity ${speed === 0 ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                                                <span>Base Waves</span>
                                                {speed === 0 && <span className="text-[10px] opacity-60">Needs speed &gt; 0</span>}
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Number of wave crests along the X axis.">
                                                    Frequency X
                                                </Tooltip>
                                                <Slider value={[waveFrequencyX]} min={0}
                                                        max={10}
                                                        disabled={speed === 0}
                                                        onValueChange={(v) => setWaveFrequencyX(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Number of wave crests along the Y axis.">
                                                    Frequency Y
                                                </Tooltip>
                                                <Slider value={[waveFrequencyY]} min={0}
                                                        max={10}
                                                        disabled={speed === 0}
                                                        onValueChange={(v) => setWaveFrequencyY(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Vertical height/intensity of waves.">
                                                    Amplitude
                                                </Tooltip>
                                                <Slider value={[waveAmplitude]} min={0}
                                                        max={10}
                                                        disabled={speed === 0}
                                                        onValueChange={(v) => setWaveAmplitude(v[0] as number)}/>
                                            </div>
                                        </div>

                                        {/* Flow Field subsection */}
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <Label
                                                className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                                <Tooltip className="text-xs w-24 text-right font-semibold cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Fluid-like simulation warping the gradient colors and shape over time.">
                                                    Flow Field
                                                </Tooltip>
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
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Wave Amplitude</span>
                                                    <Slider value={[flowDistortionA]} step={0.1}
                                                            min={0} max={5} resetValue={0}
                                                            disabled={!flowEnabled || speed === 0}
                                                            onValueChange={(v) => setFlowDistortionA(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Wave Frequency</span>
                                                    <Slider value={[flowDistortionB]} step={0.1}
                                                            min={0} max={10} resetValue={0}
                                                            disabled={!flowEnabled || speed === 0}
                                                            onValueChange={(v) => setFlowDistortionB(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Wave Scale</span>
                                                    <Slider value={[flowScale]} step={0.1}
                                                            min={0} max={5}
                                                            disabled={!flowEnabled || speed === 0}
                                                            onValueChange={(v) => setFlowScale(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Ease (Blend)</span>
                                                    <Slider value={[flowEase]} step={0.01}
                                                            min={0} max={1} resetValue={0}
                                                            disabled={!flowEnabled || speed === 0}
                                                            onValueChange={(v) => setFlowEase(v[0] as number)}/>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Domain Warp subsection */}
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <Label
                                                className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                                <Tooltip className="text-xs w-24 text-right font-semibold cursor-help border-b border-dashed border-white/20 block shrink-0 whitespace-nowrap" title="Complex curl noise distortion that warps gradient color mapping lines.">
                                                    Domain Warp
                                                </Tooltip>
                                                <div className={"w-full flex"}>
                                                    <Checkbox checked={domainWarpEnabled}
                                                              onChange={(checked: boolean) => setDomainWarpEnabled(checked)}/>
                                                </div>
                                            </Label>
                                            <div className={`space-y-2 transition-opacity ${!domainWarpEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Intensity</span>
                                                    <Slider value={[domainWarpIntensity]} step={0.05}
                                                            min={0} max={1.5} resetValue={0}
                                                            disabled={!domainWarpEnabled}
                                                            onValueChange={(v) => setDomainWarpIntensity(v[0] as number)}/>
                                                </div>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <span className="w-28 text-right pr-2 text-xs shrink-0 whitespace-nowrap">Scale</span>
                                                    <Slider value={[domainWarpScale]} step={0.1}
                                                            min={0.5} max={10}
                                                            disabled={!domainWarpEnabled}
                                                            onValueChange={(v) => setDomainWarpScale(v[0] as number)}/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Colors & Textures */}
                                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <span className="font-bold text-sm tracking-wider uppercase text-neutral-100">Colors & Textures</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-normal">
                                        Blend colors using pressure settings or enable procedural textures to generate complex geometric noise patterns.
                                    </p>

                                    <div className="space-y-3">
                                        {/* Color pressure section */}
                                        <div className={`space-y-2 transition-opacity ${enableProceduralTexture ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                                                <span>Color Pressure</span>
                                                {enableProceduralTexture && <span className="text-[10px] opacity-60">Disabled with texture</span>}
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip title="How strongly/fluidly colors blend together.">
                                                    <span className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20">Blending</span>
                                                </Tooltip>
                                                <Slider value={[colorBlending]} min={0}
                                                        max={10}
                                                        disabled={enableProceduralTexture}
                                                        onValueChange={(v) => setColorBlending(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip title="Horizontal color stretch pressure.">
                                                    <span className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20">Horizontal</span>
                                                </Tooltip>
                                                <Slider value={[horizontalPressure]} min={0}
                                                        max={10}
                                                        disabled={enableProceduralTexture}
                                                        onValueChange={(v) => setHorizontalPressure(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip title="Vertical color stretch pressure.">
                                                    <span className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20">Vertical</span>
                                                </Tooltip>
                                                <Slider value={[verticalPressure]} min={0}
                                                        max={10}
                                                        disabled={enableProceduralTexture}
                                                        onValueChange={(v) => setVerticalPressure(v[0] as number)}/>
                                            </div>
                                        </div>

                                        {/* Procedural Texture section */}
                                        <div className="space-y-2 border-t border-white/5 pt-2">
                                            <div className="font-semibold text-xs mb-2">Procedural Texture</div>
                                            <Label
                                                className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                                <Tooltip title="Enable custom generated geometry-aligned patterns instead of solid fluid flow.">
                                                    <span className="text-xs w-28 text-right cursor-help border-b border-dashed border-white/20">Enable</span>
                                                </Tooltip>
                                                <div className={"w-full flex"}>
                                                    <Checkbox
                                                        checked={enableProceduralTexture}
                                                        onChange={(checked: boolean) => setEnableProceduralTexture(checked)}/>
                                                </div>
                                            </Label>
                                            {enableProceduralTexture && (
                                                <div className="text-xs opacity-70 italic mt-1 pl-2">
                                                    ℹ️ Texture replaces color pressure controls
                                                </div>
                                            )}
                                            {enableProceduralTexture && (
                                                <div className="space-y-2 mt-2">
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
                                                        <span className="w-28 text-right pr-2 text-xs">Transparent Void</span>
                                                        <div className="w-full flex">
                                                            <Checkbox
                                                                checked={transparentTextureVoid}
                                                                onChange={(checked: boolean) => setTransparentTextureVoid(checked)}/>
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
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Visual Effects & Grading */}
                                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Sliders className="w-4 h-4 text-amber-400" />
                                        <span className="font-bold text-sm tracking-wider uppercase text-neutral-100">Visual Effects & Grading</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-normal">
                                        Fine-tune lighting adjustments, saturation, vignette, bloom glow, chromatic aberration, rim glow, iridescence, and film grain.
                                    </p>

                                    <div className="space-y-3">
                                        {/* Color adjustments */}
                                        <div className="space-y-2">
                                            <div className="text-xs font-semibold mb-1">Color Adjustments</div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip title="Adjust shadows (dark values) of the final composition.">
                                                    <span className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20">Shadows</span>
                                                </Tooltip>
                                                <Slider value={[shadows]} min={0} max={10}
                                                        onValueChange={(v) => setShadows(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip title="Adjust highlights (light values) of the final composition.">
                                                    <span className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20">Highlights</span>
                                                </Tooltip>
                                                <Slider value={[highlights]} min={0}
                                                        max={10}
                                                        onValueChange={(v) => setHighlights(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip title="Adjust color saturation / vibrancy.">
                                                    <span className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20">Saturation</span>
                                                </Tooltip>
                                                <Slider value={[saturation]} min={-10}
                                                        max={10} resetValue={0}
                                                        onValueChange={(v) => setSaturation(v[0] as number)}/>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip title="Adjust overall brightness exposure.">
                                                    <span className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20">Brightness</span>
                                                </Tooltip>
                                                <Slider value={[brightness]} step={0.05}
                                                        min={0} max={10}
                                                        onValueChange={(v) => setBrightness(v[0] as number)}/>
                                            </div>
                                        </div>

                                        {/* Vignette */}
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                                                <Tooltip title="Gradually darken the viewport edges.">
                                                    <span className="cursor-help border-b border-dashed border-white/20">Vignette</span>
                                                </Tooltip>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                                <Slider value={[vignetteIntensity]} step={0.05}
                                                        min={0} max={1} resetValue={0}
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
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                                                <Tooltip title="Makes bright highlights bleed glow into surrounding areas.">
                                                    <span className="cursor-help border-b border-dashed border-white/20">Bloom</span>
                                                </Tooltip>
                                            </div>
                                            <div className="flex flex-row gap-2 items-center">
                                                <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                                <Slider value={[bloomIntensity]} step={0.1}
                                                        min={0} max={3} resetValue={0}
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
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <div className="flex flex-row gap-2 items-center">
                                                <Tooltip title="Simulates prism lens color separation at the edges.">
                                                    <span className="w-28 text-right pr-2 text-xs cursor-help border-b border-dashed border-white/20 text-left">Chromatic Aberration</span>
                                                </Tooltip>
                                                <Slider value={[chromaticAberration]} step={0.5}
                                                        min={0} max={20} resetValue={0}
                                                        onValueChange={(v) => setChromaticAberration(v[0] as number)}/>
                                            </div>
                                        </div>

                                        {/* Fresnel (Rim Glow) */}
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <Label
                                                className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                                <Tooltip title="Add a glowing halo color border along silhouette edges.">
                                                    <span className="text-xs w-24 text-right font-semibold cursor-help border-b border-dashed border-white/20">Rim Glow</span>
                                                </Tooltip>
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
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <Label
                                                className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                                <Tooltip title="Soap bubble / oil slick rainbow shifting highlights on the 3D surface.">
                                                    <span className="text-xs w-24 text-right font-semibold cursor-help border-b border-dashed border-white/20">Iridescence</span>
                                                </Tooltip>
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

                                        {/* Grain */}
                                        <div className="space-y-2 pl-2 border-l-2 border-white/20 border-t border-white/5 pt-2">
                                            <div className="text-xs font-semibold mb-1">
                                                <Tooltip title="Add textured noise / film grain filter over the canvas.">
                                                    <span className="cursor-help border-b border-dashed border-white/20">Film Grain</span>
                                                </Tooltip>
                                            </div>
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
                                                    <Slider value={[grainSparsity]} step={0.02}
                                                            min={0} max={1} resetValue={0}
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
                                </div>

                                {/* Section 6: Background Settings */}
                                <div className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl">
                                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                        <Image className="w-4 h-4 text-teal-400" />
                                        <span className="font-bold text-sm tracking-wider uppercase text-neutral-100">Background</span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-normal">
                                        Configure the canvas background color and transparency underneath the 3D shape.
                                    </p>

                                    <div className="space-y-3">
                                        <div className="flex flex-row gap-2 items-center">
                                            <span className="w-28 text-right pr-2 text-xs">Color</span>
                                            <div className="w-full flex my-2">
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
                <LicenseDialog open={licenseDialogOpen}
                               onOpenChange={setLicenseDialogOpen}/>

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

                            {/* Format */}
                            <div className={isRecording ? 'opacity-40 pointer-events-none' : ''}>
                                <span className="text-[10px] tracking-widest font-bold uppercase opacity-70">Format</span>
                                <div className="flex items-center gap-2 mt-2">
                                    {(['mp4', 'webm'] as const).map((f) => (
                                        <button
                                            key={f}
                                            disabled={isRecording}
                                            onClick={() => setRecordFormat(f)}
                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                                recordFormat === f
                                                    ? 'bg-white text-black border-white font-semibold'
                                                    : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'
                                            }`}
                                        >
                                            {f.toUpperCase()}
                                        </button>
                                    ))}
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



                {/* Toast Notification Banner */}
                {toast && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 border border-white/25 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-2xl text-white text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`} />
                        <span className="font-medium">{toast.message}</span>
                    </div>
                )}

                {/* Drag and Drop Glassmorphic Overlay */}
                {dragActive && (
                    <div 
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md border-4 border-dashed border-white/20 m-4 rounded-3xl transition-all duration-300"
                        onDragOver={handleDrag}
                        onDragLeave={handleDragLeaveOverlay}
                        onDrop={handleDrop}
                    >
                        <div className="bg-neutral-900/80 border border-white/10 p-8 rounded-2xl flex flex-col items-center gap-4 text-center max-w-md shadow-2xl pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
                                <Upload className="w-8 h-8 text-neutral-300 animate-bounce" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Drop your image here</h3>
                                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                                    Drop any JPEG, PNG, or WebP image to extract a 5-color palette and update the animated background gradient.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
