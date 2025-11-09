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
import { NeatColor, NeatConfig, NeatGradient } from "@firecms/neat";
import { ImportConfigDialog } from "./ImportConfigDialog";

const defaultConfig = NEAT_PRESET;

export type NeatEditorProps = {
    analytics: Analytics;
};

export default function NeatEditor({ analytics }: NeatEditorProps) {
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);
    const [importDialogOpen, setImportDialogOpen] = React.useState(false);

    // Global UI visibility (for clean background testing)
    const [uiVisible, setUiVisible] = React.useState<boolean>(true);

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
        if (config.yOffset !== undefined) setYOffset(config.yOffset);
    }

    const scrollRef = useRef<number>(0);

    const [selectedPresetIndex, setSelectedPresetIndex] = React.useState<number>(0);
    const [colors, setColors] = React.useState<NeatColor[]>(defaultConfig.colors);
    const [wireframe, setWireframe] = React.useState<boolean>(defaultConfig.wireframe);
    const [speed, setSpeed] = React.useState<number>(defaultConfig.speed);
    const [colorBlending, setColorBlending] = React.useState<number>(defaultConfig.colorBlending);
    const [horizontalPressure, setHorizontalPressure] = React.useState<number>(defaultConfig.horizontalPressure);
    const [verticalPressure, setVerticalPressure] = React.useState<number>(defaultConfig.verticalPressure);
    const [shadows, setShadows] = React.useState<number>(defaultConfig.shadows);
    const [highlights, setHighlights] = React.useState<number>(defaultConfig.highlights);
    const [saturation, setSaturation] = React.useState<number>(defaultConfig.colorSaturation);
    const [brightness, setBrightness] = React.useState<number>(defaultConfig.colorBrightness);
    const [waveFrequencyX, setWaveFrequencyX] = React.useState<number>(defaultConfig.waveFrequencyX);
    const [waveFrequencyY, setWaveFrequencyY] = React.useState<number>(defaultConfig.waveFrequencyY);
    const [waveAmplitude, setWaveAmplitude] = React.useState<number>(defaultConfig.waveAmplitude);
    const [resolution, setResolution] = React.useState<number>(defaultConfig.resolution);
    const [backgroundAlpha, setBackgroundAlpha] = React.useState<number>(defaultConfig.backgroundAlpha);
    const [backgroundColor, setBackgroundColor] = React.useState<string>(defaultConfig.backgroundColor);
    const [grainIntensity, setGrainIntensity] = React.useState<number>(defaultConfig.grainIntensity);
    const [grainSparsity, setGrainSparsity] = React.useState<number>(defaultConfig.grainSparsity);
    const [grainScale, setGrainScale] = React.useState<number>(defaultConfig.grainScale);
    const [grainSpeed, setGrainSpeed] = React.useState<number>(defaultConfig.grainSpeed);
    const [yOffset, setYOffset] = React.useState<number>(0);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gradientRef = useRef<NeatGradient>();

    useEffect(() => {
        const listener = () => {
            scrollRef.current = window?.scrollY ?? 0;
        };
        if (typeof window !== "undefined") window.addEventListener("scroll", listener);
        return () => {
            if (typeof window !== "undefined") window.removeEventListener("scroll", listener);
        };
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;
        gradientRef.current = new NeatGradient({
            ref: canvasRef.current,
            colors,
            speed,
            horizontalPressure,
            verticalPressure,
            waveFrequencyX,
            waveFrequencyY,
            waveAmplitude,
            wireframe,
            colorBlending,
            shadows,
            highlights,
            colorSaturation: saturation,
            colorBrightness: brightness,
            grainSpeed,
            grainIntensity,
            grainSparsity,
            grainScale,
            resolution,
            yOffset
        });
        return gradientRef.current.destroy;
    }, []);

    useEffect(() => {
        if (!gradientRef.current) return;
        gradientRef.current.colors = colors;
        gradientRef.current.speed = speed;
        gradientRef.current.horizontalPressure = horizontalPressure;
        gradientRef.current.verticalPressure = verticalPressure;
        gradientRef.current.waveFrequencyX = waveFrequencyX;
        gradientRef.current.waveFrequencyY = waveFrequencyY;
        gradientRef.current.waveAmplitude = waveAmplitude;
        gradientRef.current.shadows = shadows;
        gradientRef.current.highlights = highlights;
        gradientRef.current.colorSaturation = saturation;
        gradientRef.current.colorBrightness = brightness;
        gradientRef.current.wireframe = wireframe;
        gradientRef.current.colorBlending = colorBlending;
        gradientRef.current.backgroundColor = backgroundColor;
        gradientRef.current.backgroundAlpha = backgroundAlpha;
        gradientRef.current.grainIntensity = grainIntensity;
        gradientRef.current.grainSparsity = grainSparsity;
        gradientRef.current.grainScale = grainScale;
        gradientRef.current.grainSpeed = grainSpeed;
        gradientRef.current.resolution = resolution;
        gradientRef.current.yOffset = yOffset;
    }, [speed, horizontalPressure, verticalPressure, waveFrequencyX, waveFrequencyY, waveAmplitude, colors, shadows, highlights, saturation, brightness, wireframe, colorBlending, resolution, backgroundColor, backgroundAlpha, grainIntensity, grainSparsity, grainScale, grainSpeed, yOffset]);

    const handleColorChange = (newValue: NeatColor, index: number) => {
        const newColors = [...colors];
        newColors[index] = newValue;
        setColors(newColors);
    };

    const onGetTheCodeClick = () => {
        setDialogOpen(true);
        logEvent(analytics, 'open_get_code_dialog', { config });
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
        yOffset
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
        <div className="relative w-full h-full">
            {/* Fullscreen gradient canvas */}
            <div className={"fixed w-full h-full top-0 right-0 z-0"}>
                <canvas style={{ height: "100%", width: "100%" }} ref={canvasRef} />
            </div>

            {/* Centered NEAT title overlay (visible only when UI is visible) */}
            {uiVisible && (
                <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="relative p-2 select-none text-center flex flex-col items-center">
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
                        <IconButton className="text-inherit" onClick={prevPreset}>
                            <ChevronLeft className="w-5 h-5"/>
                        </IconButton>
                    </Tooltip>
                    <Select
                        value={selectedPreset}
                        className={fontClass + " text-base sm:text-lg py-1 rounded-md bg-transparent text-white w-44 sm:w-56 border-transparent"}
                        onValueChange={(preset) => { logEvent(analytics, 'select_preset', { preset }); setPreset(preset); }}
                    >
                        {Object.keys(PRESETS).map((preset) => (
                            <SelectItem className={fontMap[preset] + " "} key={preset} value={preset}>
                                {preset}
                            </SelectItem>
                        ))}
                    </Select>
                    <Tooltip title="Next preset (→)">
                        <IconButton className="text-inherit" onClick={nextPreset}>
                            <ChevronRight className="w-5 h-5"/>
                        </IconButton>
                    </Tooltip>
                    <div className="w-px h-7 mx-1 bg-white/20"/>
                    <Button size="sm" className="px-3 py-1" onClick={() => setDrawerOpen(true)}>
                        Edit
                    </Button>
                    <div className="w-px h-7 mx-1 bg-white/20"/>
                    <Tooltip title="Get the code">
                        <Button variant="text" size="sm" className="px-2 py-1" onClick={() => { onGetTheCodeClick(); logEvent(analytics, 'get_the_code'); }}>
                            Code
                        </Button>
                    </Tooltip>
                    <Tooltip title="Download PNG">
                        <IconButton className="text-inherit" onClick={() => gradientRef.current?.downloadAsPNG()}>
                            <Download className="w-5 h-5"/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Import config">
                        <IconButton className="text-inherit" onClick={() => setImportDialogOpen(true)}>
                            <Import className="w-5 h-5"/>
                        </IconButton>
                    </Tooltip>
                </div>
            )}

            {/* Quick restore when UI is hidden */}
            {!uiVisible && (
                <div className="fixed bottom-4 right-4 z-20">
                    <Button size="sm" variant="outline" className="px-3 py-1 bg-white/70" onClick={() => setUiVisible(true)}>
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
                        <div className="p-4 pt-20 flex flex-col gap-6 overflow-auto flex-grow panel-scroll">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] tracking-widest font-bold uppercase opacity-70">Preset</span>
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

                            <div className="flex flex-row my-2 ml-2">
                                <span className="w-28 pr-2 font-bold text-sm text-right">Speed</span>
                                <Slider
                                    value={[speed]}
                                    step={.5}
                                    min={0}
                                    max={10}
                                    onValueChange={(v) => setSpeed(v[0] as number)}
                                />
                            </div>

                            {/* Color pressure section */}
                            <div className="space-y-2">
                                <div className="font-semibold text-sm mb-2">Color pressure</div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Blending</span>
                                    <Slider value={[colorBlending]} min={0} max={10} onValueChange={(v) => setColorBlending(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Horizontal</span>
                                    <Slider value={[horizontalPressure]} min={0} max={10} onValueChange={(v) => setHorizontalPressure(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Vertical</span>
                                    <Slider value={[verticalPressure]} min={0} max={10} onValueChange={(v) => setVerticalPressure(v[0] as number)} />
                                </div>
                            </div>

                            {/* Waves section */}
                            <div className="space-y-2">
                                <div className="font-semibold text-sm mb-2">Waves</div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Frequency X</span>
                                    <Slider value={[waveFrequencyX]} min={0} max={10} onValueChange={(v) => setWaveFrequencyX(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Frequency Y</span>
                                    <Slider value={[waveFrequencyY]} min={0} max={10} onValueChange={(v) => setWaveFrequencyY(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Amplitude</span>
                                    <Slider value={[waveAmplitude]} min={0} max={10} onValueChange={(v) => setWaveAmplitude(v[0] as number)} />
                                </div>
                            </div>

                            {/* Post-processing section */}
                            <div className="space-y-2">
                                <div className="font-semibold text-sm mb-2">Post-processing</div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Shadows</span>
                                    <Slider value={[shadows]} min={0} max={10} onValueChange={(v) => setShadows(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Highlights</span>
                                    <Slider value={[highlights]} min={0} max={10} onValueChange={(v) => setHighlights(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Saturation</span>
                                    <Slider value={[saturation]} min={-10} max={10} onValueChange={(v) => setSaturation(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Brightness</span>
                                    <Slider value={[brightness]} step={0.05} min={0} max={10} onValueChange={(v) => setBrightness(v[0] as number)} />
                                </div>
                            </div>

                            {/* Shape section */}
                            <div className="space-y-2">
                                <div className="font-semibold text-sm mb-2">Shape</div>
                                <Tooltip title={"The density of triangles in the 3D mesh. Reduce to increase performance"}>
                                    <div className="flex flex-row gap-2 items-end">
                                        <span className="w-28 text-right pr-2 text-xs">Resolution</span>
                                        <Slider value={[resolution]} step={0.05} min={0.05} max={2} onValueChange={(v) => setResolution(v[0] as number)} />
                                    </div>
                                </Tooltip>
                                <div className="flex flex-row gap-2 items-center">
                                    <span className="w-28 text-right pr-2 text-xs">Background</span>
                                    <div className={"w-full flex my-4"}>
                                        <div className="text-center pl-2">
                                            <ColorSwatch
                                                color={{ color: backgroundColor, enabled: true }}
                                                showEnabled={false}
                                                onChange={color => setBackgroundColor(color.color)}
                                            />
                                        </div>
                                        <div className="flex-grow pl-2 flex flex-col gap-2">
                                            <span className="text-xs">Background Alpha</span>
                                            <Slider value={[backgroundAlpha]} step={0.05} min={0} max={1} onValueChange={(v) => setBackgroundAlpha(v[0] as number)} />
                                        </div>
                                    </div>
                                </div>
                                <Label className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800">
                                    <span className="text-xs w-28 text-right">Wireframe</span>
                                    <div className={"w-full flex"}>
                                        <Checkbox checked={wireframe} onChange={(checked: boolean) => setWireframe(checked)} />
                                    </div>
                                </Label>
                            </div>

                            {/* Grain section */}
                            <div className="space-y-2">
                                <div className="font-semibold text-sm mb-2">Grain</div>
                                <div className="flex flex-row gap-2 items-center">
                                    <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                    <Slider value={[grainIntensity]} step={0.025} min={0} max={1} onValueChange={(v) => setGrainIntensity(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <span className="w-28 text-right pr-2 text-xs">Scale</span>
                                    <Slider value={[grainScale]} step={1} min={0} max={100} onValueChange={(v) => setGrainScale(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <span className="w-28 text-right pr-2 text-xs">Sparsity</span>
                                    <Slider value={[grainSparsity]} step={.02} min={0} max={1} onValueChange={(v) => setGrainSparsity(v[0] as number)} />
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <span className="w-28 text-right pr-2 text-xs">Speed</span>
                                    <Slider value={[grainSpeed]} step={0.1} min={0} max={10} onValueChange={(v) => setGrainSpeed(v[0] as number)} />
                                </div>
                            </div>

                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Vertical Offset</span>
                                <Slider value={[yOffset]} step={1} min={0} max={2000} onValueChange={(v) => setYOffset(v[0] as number)} />
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
            <GetCodeDialog open={dialogOpen} onOpenChange={setDialogOpen} config={config}/>
            <ImportConfigDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onConfigImport={handleConfigImport} />
        </div>
    );
}
