import React, { useEffect, useRef } from "react";
import "@fontsource/sofia-sans";
import {
    Button,
    Checkbox,
    ChevronLeftIcon,
    cls,
    DownloadIcon,
    EditIcon,
    ExpandablePanel,
    IconButton,
    KeyboardArrowLeftIcon,
    KeyboardArrowRightIcon,
    Label,
    Select,
    SelectItem,
    Sheet,
    Slider,
    Tooltip
} from "@firecms/ui";
import { ColorSwatch } from "./ColorSwatch";
import { attributionMap, fontMap, NEAT_PRESET, PRESETS } from "./presets";
import { getComplementaryColor, isDarkColor } from "../utils/colors";
import { CodeDialog } from "./CodeDialog";
import { Analytics } from "@firebase/analytics";
import { logEvent } from "firebase/analytics";
import { NeatColor, NeatConfig, NeatGradient } from "@firecms/neat";

const drawerWidth = 360;
const defaultConfig = NEAT_PRESET;

export type NeatEditorProps = {
    analytics: Analytics;
};

export default function NeatEditor({ analytics }: NeatEditorProps) {
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);

    const handleDrawerOpen = () => {
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
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

        if (!canvasRef.current)
            return;

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
            resolution
        });

        return gradientRef.current.destroy;

    }, []);

    useEffect(() => {
        if (gradientRef.current) {
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
        }
    }, [speed, horizontalPressure, verticalPressure, waveFrequencyX, waveFrequencyY, waveAmplitude, colors, shadows, highlights, saturation, brightness, wireframe, colorBlending, resolution, backgroundColor, backgroundAlpha, grainIntensity, grainSparsity, grainScale, grainSpeed]);

    const handleColorChange = (newValue: NeatColor, index: number) => {
        const newColors = [...colors];
        newColors[index] = newValue;
        setColors(newColors);
    };

    const onGetTheCodeClick = () => {
        setDialogOpen(true);
        logEvent(analytics, 'open_get_code_dialog', { config });
    };

    const [lightText, setLightText] = React.useState<boolean>(true);
    const [complementaryColor, setComplementaryColor] = React.useState<string | undefined>();
    useEffect(() => {
        setLightText(isDarkColor(colors[0].color));
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
    };

    const selectedPreset = Object.keys(PRESETS)[selectedPresetIndex];

    function setPreset(preset: string) {
        setSelectedPresetIndex(Object.keys(PRESETS).indexOf(preset));
        updatePresetConfig(PRESETS[preset]);
    }

    const fontClass = fontMap[selectedPreset] || 'font-sans';
    const attribution = attributionMap[selectedPreset];

    const prevPreset = () => {
        setSelectedPresetIndex((selectedPresetIndex - 1 + Object.keys(PRESETS).length) % Object.keys(PRESETS).length);
        setPreset(Object.keys(PRESETS)[(selectedPresetIndex - 1 + Object.keys(PRESETS).length) % Object.keys(PRESETS).length]);
    };
    const nextPreset = () => {
        setSelectedPresetIndex((selectedPresetIndex + 1) % Object.keys(PRESETS).length);
        setPreset(Object.keys(PRESETS)[(selectedPresetIndex + 1) % Object.keys(PRESETS).length]);
    };

    // listen to right and left arrow keys
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") {
                nextPreset();
            } else if (event.key === "ArrowLeft") {
                prevPreset();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedPresetIndex]);

    return (
        <div className="relative w-full h-full">
            <IconButton
                onClick={handleDrawerOpen}
                className={`fixed right-4 top-4 bg-black bg-opacity-20 hover:bg-black hover:bg-opacity-30 rounded-full z-10 ${drawerOpen ? 'hidden' : ''}`}
            >
                <EditIcon className="w-6 h-6 text-white"/>
            </IconButton>

            <Sheet open={drawerOpen}
                // modal={false}
                   includeBackgroundOverlay={false}
                   className={"w-[360px] bg-white bg-opacity-50 backdrop-blur border-none h-full"}
                   onOpenChange={setDrawerOpen}
                   side={"right"}
            >
                <IconButton
                    onClick={handleDrawerClose}
                    className="fixed left-4 top-4 bg-black bg-opacity-10 p-2 rounded-full"
                >
                    <ChevronLeftIcon className="w-6 h-6"/>
                </IconButton>

                <div className="flex flex-col h-full gap-4">
                    <div className="p-4 pt-20 flex flex-col gap-4 overflow-auto flex-grow ">
                        <span className="text-xs font-bold">PRESET</span>
                        <Select value={selectedPreset}
                                fullWidth={true}
                                className={fontClass + " text-xl"}
                                onValueChange={(preset) => {
                                    logEvent(analytics, 'select_preset', {
                                        preset
                                    });
                                    setPreset(preset);
                                }}
                                renderValue={(preset: string) => {
                                    return preset;
                                }}>
                            {Object.keys(PRESETS).map((preset) =>
                                <SelectItem
                                    className={fontMap[preset] + " "}
                                    key={preset}
                                    value={preset}>
                                    {preset}
                                </SelectItem>
                            )}

                        </Select>
                        <div className="flex space-x-4 justify-evenly mt-4 mb-2">
                            {colors.map((color, index) => (
                                <ColorSwatch
                                    key={index}
                                    color={color}
                                    showEnabled={true}
                                    onChange={(newColor) => handleColorChange(newColor, index)}
                                />
                            ))}
                        </div>

                        <div className="flex flex-row my-2 ml-2">
                            <span className="w-28 pr-2 font-bold text-sm text-right">Speed</span>
                            <Slider
                                size={"small"}
                                value={[speed]}
                                step={.5}
                                min={0}
                                max={10}
                                onValueChange={(newValue) => setSpeed(newValue[0] as number)}
                            />
                        </div>

                        <ExpandablePanel
                            title={<span className="font-semibold text-sm">Color pressure</span>}
                            innerClassName={"space-y-1"}
                            className={"border-none"}
                        >
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Blending</span>
                                <Slider
                                    size={"small"}
                                    value={[colorBlending]}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setColorBlending(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Horizontal</span>
                                <Slider

                                    size={"small"}
                                    value={[horizontalPressure]}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setHorizontalPressure(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Vertical</span>
                                <Slider
                                    size={"small"}
                                    value={[verticalPressure]}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setVerticalPressure(newValue[0] as number)}
                                />
                            </div>
                        </ExpandablePanel>

                        <ExpandablePanel title={<span className="font-semibold text-sm">Waves</span>}
                                         innerClassName={"space-y-1"}
                                         className={"border-none"}>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Frequency X</span>
                                <Slider
                                    size={"small"}
                                    value={[waveFrequencyX]}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setWaveFrequencyX(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Frequency Y</span>
                                <Slider
                                    size={"small"}
                                    value={[waveFrequencyY]}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setWaveFrequencyY(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Amplitude</span>
                                <Slider

                                    size={"small"}
                                    value={[waveAmplitude]}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setWaveAmplitude(newValue[0] as number)}
                                />
                            </div>
                        </ExpandablePanel>

                        <ExpandablePanel title={<span className="font-semibold text-sm">Post-processing</span>}
                                         innerClassName={"space-y-1"}
                                         className={"border-none"}>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Shadows</span>
                                <Slider

                                    size={"small"}
                                    value={[shadows]}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setShadows(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Highlights</span>
                                <Slider

                                    size={"small"}
                                    value={[highlights]}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setHighlights(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Saturation</span>
                                <Slider

                                    size={"small"}
                                    value={[saturation]}
                                    min={-10}
                                    max={10}
                                    onValueChange={(newValue) => setSaturation(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-end">
                                <span className="w-28 text-right pr-2 text-xs">Brightness</span>
                                <Slider
                                    size={"small"}
                                    value={[brightness]}
                                    step={0.05}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setBrightness(newValue[0] as number)}
                                />
                            </div>
                        </ExpandablePanel>

                        <ExpandablePanel title={<span className="font-semibold text-sm">Shape</span>}
                                         innerClassName={"space-y-1"}
                                         className={"border-none"}>
                            <Tooltip
                                title={"The density of triangles in the 3D mesh. Reduce to increase performance"}>
                                <div className="flex flex-row gap-2 items-end">
                                    <span className="w-28 text-right pr-2 text-xs">Resolution</span>
                                    <Slider
                                        size={"small"}
                                        value={[resolution]}
                                        step={0.05}
                                        min={0.05}
                                        max={2}
                                        onValueChange={(newValue) => setResolution(newValue[0] as number)}
                                    />
                                </div>
                            </Tooltip>

                            <div className="flex flex-row gap-2 items-center">
                                <span className="w-28 text-right pr-2 text-xs">Background</span>
                                <div className={"w-full flex"}>
                                    <div className="text-center pl-2">
                                        <ColorSwatch
                                            color={{ color: backgroundColor, enabled: true }}
                                            showEnabled={false}
                                            onChange={color => setBackgroundColor(color.color)}
                                        />
                                    </div>
                                    <div className="flex-grow pl-2 flex flex-col gap-2">
                                        <span className="text-xs">Background Alpha</span>
                                        <Slider
                                            size={"small"}
                                            value={[backgroundAlpha]}
                                            step={0.05}
                                            min={0}
                                            max={1}
                                            onValueChange={(newValue) => setBackgroundAlpha(newValue[0] as number)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Label
                                className="cursor-pointer flex items-center gap-2 [&:has(:checked)]:bg-gray-100 dark:[&:has(:checked)]:bg-gray-800"
                            >
                                <span className="text-xs w-28 text-right">Wireframe</span>
                                <div className={"w-full flex"}>
                                    <Checkbox
                                        checked={wireframe}
                                        onCheckedChange={(checked: boolean) => setWireframe(checked)}
                                    />
                                </div>
                            </Label>


                        </ExpandablePanel>

                        <ExpandablePanel title={<span className="font-semibold text-sm">Grain</span>}
                                         className={"border-none"}
                                         innerClassName={"space-y-1"}>
                            <div className="flex flex-row gap-2 items-center">
                                <span className="w-28 text-right pr-2 text-xs">Intensity</span>
                                <Slider
                                    size={"small"}
                                    value={[grainIntensity]}
                                    step={0.025}
                                    min={0}
                                    max={1}
                                    onValueChange={(newValue) => setGrainIntensity(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <span className="w-28 text-right pr-2 text-xs">Scale</span>
                                <Slider
                                    size={"small"}
                                    value={[grainScale]}
                                    step={1}
                                    min={0}
                                    max={100}
                                    onValueChange={(newValue) => setGrainScale(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <span className="w-28 text-right pr-2 text-xs">Sparsity</span>
                                <Slider
                                    size={"small"}
                                    value={[grainSparsity]}
                                    step={.02}
                                    min={0}
                                    max={1}
                                    onValueChange={(newValue) => setGrainSparsity(newValue[0] as number)}
                                />
                            </div>
                            <div className="flex flex-row gap-2 items-center">
                                <span className="w-28 text-right pr-2 text-xs">Speed</span>
                                <Slider
                                    size={"small"}
                                    value={[grainSpeed]}
                                    step={0.1}
                                    min={0}
                                    max={10}
                                    onValueChange={(newValue) => setGrainSpeed(newValue[0] as number)}
                                />
                            </div>

                        </ExpandablePanel>

                    </div>

                    <div className={"p-4"}>
                        <Button
                            size={"large"}
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

            <CodeDialog open={dialogOpen} onOpenChange={setDialogOpen} config={config}/>

            <div className={"fixed w-full h-full top-0 right-0"}>
                <canvas
                    style={{
                        height: "100%",
                        width: "100%",
                    }}
                    ref={canvasRef}
                />
            </div>

            <div
                className="relative flex flex-col items-center justify-center font-sans h-screen text-white text-center">
                <div className="relative flex flex-col p-4">
                    <h1
                        className="font-semibold text-9xl mix-blend-soft-light opacity-60 text-[12rem] sm:text-[16rem] md:text-[24rem]"
                        style={{ color: complementaryColor }}
                    >
                        NEAT
                    </h1>
                    <h1
                        className="absolute z-100 font-semibold text-9xl mix-blend-color-dodge opacity-60 text-[12rem] sm:text-[16rem] md:text-[24rem]"
                        style={{ color: complementaryColor }}
                    >
                        NEAT
                    </h1>
                </div>
                {/*<div className={`relative flex flex-col p-4`}>*/}
                {/*    <h1 className={`font-semibold text-9xl mix-blend-color-dodge opacity-80 text-[12rem] sm:text-[16rem] md:text-[24rem]`}*/}
                {/*        style={{*/}
                {/*            color: complementaryColor*/}
                {/*        }}>NEAT</h1>*/}

                {/*</div>*/}
                <div className={cls({
                    "text-black": !lightText,
                    "text-white": lightText
                }, "flex flex-col items-center gap-4")}>
                    <h2 className={"max-w-full font-bold text-lg md:text-xl uppercase"}>
                        Beautiful 3D gradient animations for your website
                    </h2>
                    <div className={"flex flex-row gap-4 items-center w-96"}>
                        <IconButton
                            className={"text-inherit"}
                            onClick={prevPreset}>
                            <KeyboardArrowLeftIcon/>
                        </IconButton>

                        <div className={"flex-grow font-bold text-4xl " + fontClass}>
                            {selectedPreset}
                        </div>
                        <IconButton
                            className={"text-inherit"}
                            onClick={nextPreset}>
                            <KeyboardArrowRightIcon/>
                        </IconButton>
                    </div>
                    {attribution &&
                        <a href={"https://x.com/" + attribution.x}
                           target={"_blank"}
                           rel={"noreferrer noopener"}
                           className={"text-sm text-inherit"}>{attribution.x}</a>}
                    {!attribution && <a className={"text-sm"}>&nbsp;</a>}
                    <div className={"flex flex-row gap-4 items-center mt-8"}>
                        <IconButton
                            className={"text-inherit"}
                            onClick={() => {
                                gradientRef.current?.downloadAsPNG();
                            }}
                            size={"large"}>
                            <DownloadIcon size={"small"}/>
                        </IconButton>
                        <Button onClick={handleDrawerOpen}
                                size={"large"}
                                color={"secondary"}>
                            <EditIcon className="mr-2" size={"small"}/>
                            EDIT THIS GRADIENT
                        </Button>

                        <Button
                            size={"large"}
                            onClick={() => {
                                onGetTheCodeClick();
                                logEvent(analytics, 'use_this_gradient');
                            }}
                        >
                            USE THIS GRADIENT
                        </Button>
                    </div>
                    <p className={"mt-2"}>Built with ❤️ by <a href="https://firecms.co"
                                                              target="_blank"
                                                              className="text-blue-900 bg-gray-100 bg-opacity-30 mx-1 px-2 py-0.5 rounded">FireCMS</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
