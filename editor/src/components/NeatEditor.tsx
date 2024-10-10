import React, { useEffect, useRef } from "react";

import { NeatColor, NeatConfig, NeatGradient } from "@firecms/neat";

import "@fontsource/sofia-sans";

import { Box, Button, FormControlLabel, Slider, Tooltip, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import { ColorSwatch } from "./ColowSwatch";
import Checkbox from "@mui/material/Checkbox";
import { ExpandablePanel } from "./ExpandablePanel";
import { FilledMenuItem, FilledSelect } from "./FilledSelect";
import { PRESETS, STRIPE_PRESET } from "./presets";
import { isDarkColor } from "../utils/colors";
import { CodeDialog } from "./CodeDialog";
import { Analytics } from "@firebase/analytics";
import { logEvent } from "firebase/analytics";

const drawerWidth = 360;

const defaultConfig = STRIPE_PRESET;

export type NeatEditorProps = { analytics: Analytics };

export default function NeatEditor({ analytics }: NeatEditorProps) {

    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const handleDrawerOpen = () => {
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
    };

    const updatePresetConfig = (config: NeatConfig) => {

        console.log("Updating preset config", config);

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
        if (config.grainSpeed !== undefined) setGrainSpeed(config.grainSpeed);
        if (config.grainScale !== undefined) setGrainScale(config.grainScale);
    }

    const scrollRef = useRef<number>(0);

    const [selectedPreset, setSelectedPreset] = React.useState(Object.keys(PRESETS)[0]);

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
    const [grainScale, setGrainScale] = React.useState<number>(defaultConfig.grainScale);
    const [grainSpeed, setGrainSpeed] = React.useState<number>(defaultConfig.grainSpeed);

    const handleColorChange = (newValue: NeatColor, index: number) => {
        const newColors = [...colors];
        newColors[index] = newValue;
        setColors(newColors);
    }

    useEffect(() => {
        const listener = () => {
            if (typeof window !== "undefined")
                scrollRef.current = window?.scrollY ?? 0;
        };
        listener();
        if (typeof window !== "undefined")
            window.addEventListener("scroll", listener);
        return () => {
            if (typeof window !== "undefined")
                window.removeEventListener("scroll", listener);
        };
    }, [window]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const gradientRef = useRef<NeatGradient>();

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
            grainScale,
            resolution
        });

        return gradientRef.current.destroy;

    }, [canvasRef.current]);

    const onGetTheCodeClick = () => {
        setDialogOpen(true);
        logEvent(analytics, 'open_get_code_dialog', {
            config
        });
    };

    const [lightText, setLightText] = React.useState(true);
    useEffect(() => {
        setLightText(isDarkColor(colors[0].color));
    }, [colors[0]]);

    // const colorsArray = getColorsArray();
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
            gradientRef.current.grainScale = grainScale;
            gradientRef.current.grainSpeed = grainSpeed;
            gradientRef.current.resolution = resolution;
        }
    }, [speed, horizontalPressure, verticalPressure, waveFrequencyX, waveFrequencyY, waveAmplitude, colors, shadows, highlights, saturation, brightness, wireframe, colorBlending, resolution, backgroundColor, backgroundAlpha, grainIntensity, grainScale, grainSpeed]);

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
        grainIntensity,
        grainSpeed,
        resolution
    }

    return (
        <Box sx={{
            position: 'relative',
        }}>

            <IconButton
                color="inherit"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{
                    m: 0,
                    position: "fixed",
                    left: 16,
                    top: 16,
                    backgroundColor: "#00000010",
                    zIndex: 10,
                    ...(drawerOpen && { display: 'none' })
                }}
            >
                <MenuIcon/>
            </IconButton>

            <Drawer
                sx={{
                    width: drawerWidth,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },

                }}
                PaperProps={{
                    sx: {
                        // position: "relative",
                        maxHeight: "100vh",
                        backgroundColor: "#FFFFFF99",
                        background: "linear-gradient(hsla(0,0%,100%,.4),hsla(0,0%,100%,.3) 25%,rgba(246,249,252,.3) 50%,rgba(246,249,252,.6)  100%)",
                        boxShadow: "inset 0 1px 1px 0 hsl(0deg 0% 100% / 10%), 0 50px 100px -20px rgb(50 50 93 / 25%), 0 30px 60px -30px rgb(0 0 0 / 30%)",
                        overflowX: "scroll",
                        overflowY: "visible",
                        backdropFilter: "blur(8px)",
                    }
                }}
                variant="persistent"
                anchor="left"
                open={drawerOpen}
            >

                <IconButton onClick={handleDrawerClose}
                            sx={{
                                position: "fixed",
                                left: 16,
                                top: 16,
                                backgroundColor: "#00000010",
                                zIndex: 100
                            }}>
                    <ChevronLeftIcon/>
                </IconButton>

                <Box sx={{
                    height: "100%",
                    overflow: "auto",
                    p: 2
                }}>

                    <Box sx={{
                        mt: "64px",
                        display: "flex",
                        flexDirection: "column",
                        // height: "100%",
                        // gap: 1,
                        overflow: "visible"

                    }}>

                        <Typography variant={"caption"}>PRESET</Typography>
                        <FilledSelect value={selectedPreset}
                                      variant={"filled"}
                                      label={"Preset"}
                                      renderValue={(preset: string) => {
                                          return preset.toUpperCase();
                                      }}>
                            {Object.keys(PRESETS).map((preset) =>
                                <FilledMenuItem
                                    key={preset}
                                    value={preset}
                                    onClick={() => {
                                        logEvent(analytics, 'select_preset', {
                                            preset
                                        });
                                        setSelectedPreset(preset);
                                        updatePresetConfig(PRESETS[preset]);
                                    }}>
                                    {preset.toUpperCase()}
                                </FilledMenuItem>
                            )}

                        </FilledSelect>

                        <Box sx={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 1,
                            mt: 4,
                            mb: 2,
                            justifyContent: "space-evenly"
                        }}>
                            <ColorSwatch
                                color={colors[0]}
                                showEnabled={true}
                                onChange={(color) => handleColorChange(color, 0)}/>
                            <ColorSwatch
                                color={colors[1]}
                                showEnabled={true}
                                onChange={(color) => handleColorChange(color, 1)}/>
                            <ColorSwatch
                                color={colors[2]}
                                showEnabled={true}
                                onChange={(color) => handleColorChange(color, 2)}/>
                            <ColorSwatch
                                color={colors[3]}
                                showEnabled={true}
                                onChange={(color) => handleColorChange(color, 3)}/>
                            <ColorSwatch
                                color={colors[4]}
                                showEnabled={true}
                                onChange={(color) => handleColorChange(color, 4)}/>
                        </Box>

                        <Box sx={{
                            display: "flex",
                            flexDirection: "row",
                            mt: 2,
                            mb: 2,
                            ml: 2
                        }}>
                            <Typography variant={"button"}
                                        gutterBottom
                                        sx={{
                                            width: 100,
                                            pr: 1
                                        }}>Speed</Typography>
                            <Slider
                                valueLabelDisplay="auto"
                                value={speed}
                                size={"small"}
                                min={0}
                                max={10}
                                onChange={(event, newValue) => {
                                    setSpeed(newValue as number)
                                }}
                            />
                        </Box>

                        <ExpandablePanel
                            Title={
                                <Typography variant={"button"}>
                                    Color pressure
                                </Typography>
                            }>

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}>Blending </Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={colorBlending}
                                    size={"small"}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setColorBlending(newValue as number)
                                    }}
                                />
                            </Box>
                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}>Horizontal </Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={horizontalPressure}
                                    size={"small"}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setHorizontalPressure(newValue as number)
                                    }}
                                />
                            </Box>
                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography variant={"caption"}
                                            gutterBottom sx={{
                                    width: 100,
                                    textAlign: "right",
                                    pr: 1
                                }}>
                                    Vertical
                                </Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={verticalPressure}
                                    size={"small"}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setVerticalPressure(newValue as number)
                                    }}
                                />
                            </Box>

                        </ExpandablePanel>

                        <ExpandablePanel
                            Title={
                                <Typography variant={"button"}>
                                    Waves
                                </Typography>
                            }>

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}>
                                    Frequency X
                                </Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={waveFrequencyX}
                                    size={"small"}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setWaveFrequencyX(newValue as number)
                                    }}
                                />
                            </Box>
                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}>Frequency
                                    Y</Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={waveFrequencyY}
                                    size={"small"}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setWaveFrequencyY(newValue as number)
                                    }}
                                />
                            </Box>

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}> Amplitude</Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={waveAmplitude}
                                    size={"small"}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setWaveAmplitude(newValue as number)
                                    }}
                                />
                            </Box>

                        </ExpandablePanel>


                        <ExpandablePanel
                            Title={
                                <Typography variant={"button"}>
                                    Post-processing
                                </Typography>
                            }>

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}> Shadows</Typography>

                                <Slider
                                    valueLabelDisplay="auto"
                                    value={shadows}
                                    size={"small"}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setShadows(newValue as number)
                                    }}
                                />
                            </Box>
                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}> Highlights</Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={highlights}
                                    size={"small"}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setHighlights(newValue as number)
                                    }}
                                />
                            </Box>

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}>Saturation</Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={saturation}
                                    size={"small"}
                                    min={-10}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setSaturation(newValue as number)
                                    }}
                                />
                            </Box>
                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "flex-end"
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                width: 100,
                                                textAlign: "right",
                                                pr: 1
                                            }}>Brightness</Typography>
                                <Slider
                                    valueLabelDisplay="auto"
                                    value={brightness}
                                    size={"small"}
                                    step={.05}
                                    min={0}
                                    max={10}
                                    onChange={(event, newValue) => {
                                        setBrightness(newValue as number)
                                    }}
                                />
                            </Box>

                        </ExpandablePanel>

                        <ExpandablePanel
                            Title={
                                <Typography variant={"button"}>
                                    Shape
                                </Typography>
                            }>

                            <Tooltip title={"The density of triangles in the 3d mesh. Reduce to increase performance"}>
                                <Box sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: 1,
                                    alignItems: "flex-end"
                                }}>
                                    <Typography gutterBottom
                                                variant={"caption"}
                                                sx={{
                                                    width: 100,
                                                    textAlign: "right",
                                                    pr: 1
                                                }}>Resolution</Typography>
                                    <Slider
                                        valueLabelDisplay="auto"
                                        value={resolution}
                                        size={"small"}
                                        step={.05}
                                        min={.05}
                                        max={2}
                                        onChange={(event, newValue) => {
                                            setResolution(newValue as number)
                                        }}
                                    />
                                </Box>
                            </Tooltip>


                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "center",
                            }}>
                                <Typography gutterBottom
                                            variant={"caption"}
                                            sx={{
                                                pr: 1
                                            }}>Background</Typography>

                                <Box sx={{
                                    textAlign: "center",
                                    pr: 1
                                }}>

                                    <ColorSwatch
                                        color={{
                                            color: backgroundColor,
                                            enabled: true
                                        }}
                                        showEnabled={false}
                                        onChange={(color) => setBackgroundColor(color.color)}/>
                                </Box>

                                <Box sx={{
                                    flexGrow: 1
                                }}>
                                    <Typography gutterBottom
                                                variant={"caption"}
                                                sx={{
                                                    pr: 1,
                                                }}>Alpha </Typography>
                                    <Slider
                                        valueLabelDisplay="auto"
                                        value={backgroundAlpha}
                                        size={"small"}
                                        step={.05}
                                        min={0}
                                        max={1}
                                        onChange={(event, newValue) => {
                                            setBackgroundAlpha(newValue as number)
                                        }}
                                    />
                                </Box>
                            </Box>

                            <FormControlLabel
                                value={wireframe}

                                control={<Checkbox
                                    checked={wireframe}
                                    onChange={(evt: React.ChangeEvent<HTMLInputElement>) => setWireframe(evt.target.checked)}/>}
                                label={<Typography
                                    variant={"caption"}>Wireframe</Typography>}/>

                        </ExpandablePanel>

                        <ExpandablePanel
                            Title={
                                <Typography variant={"button"}>
                                    Grain
                                </Typography>
                            }>

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "center",
                            }}>

                                <Box sx={{
                                    flexGrow: 1
                                }}>
                                    <Typography gutterBottom
                                                variant={"caption"}
                                                sx={{
                                                    pr: 1,
                                                }}>Grain intensity </Typography>
                                    <Slider
                                        valueLabelDisplay="auto"
                                        value={grainIntensity}
                                        size={"small"}
                                        step={.025}
                                        min={0}
                                        max={1}
                                        onChange={(event, newValue) => {
                                            setGrainIntensity(newValue as number)
                                        }}
                                    />
                                </Box>
                            </Box>

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "center",
                            }}>

                                <Box sx={{
                                    flexGrow: 1
                                }}>
                                    <Typography gutterBottom
                                                variant={"caption"}
                                                sx={{
                                                    pr: 1,
                                                }}>Grain scale </Typography>
                                    <Slider
                                        valueLabelDisplay="auto"
                                        value={grainScale}
                                        size={"small"}
                                        step={1}
                                        min={0}
                                        max={100}
                                        onChange={(event, newValue) => {
                                            setGrainScale(newValue as number)
                                        }}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                gap: 1,
                                alignItems: "center",
                            }}>

                                <Box sx={{
                                    flexGrow: 1
                                }}>
                                    <Typography gutterBottom
                                                variant={"caption"}
                                                sx={{
                                                    pr: 1,
                                                }}>Grain speed </Typography>
                                    <Slider
                                        valueLabelDisplay="auto"
                                        value={grainSpeed}
                                        size={"small"}
                                        step={.1}
                                        min={0}
                                        max={5}
                                        onChange={(event, newValue) => {
                                            setGrainSpeed(newValue as number)
                                        }}
                                    />
                                </Box>
                            </Box>


                        </ExpandablePanel>
                    </Box>
                    <Box
                        sx={{
                            position: "fixed",
                            left: 0,
                            bottom: 0,
                            right: 0,
                            p: 2
                        }}>
                        <Button variant="contained"
                                size="large"
                                disableElevation
                                onClick={onGetTheCodeClick}
                                fullWidth>
                            Get the code
                        </Button>
                    </Box>

                    <Box sx={{ height: 80 }}/>
                </Box>
            </Drawer>

            <CodeDialog open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        config={config}/>

            <Box sx={{
                height: "100vh",
            }}>
                <Box sx={{
                    position: "fixed",
                    height: "100%",
                    width: "100%",
                }}>
                    <canvas
                        style={{
                            height: "100%",
                            width: "100%",
                        }}
                        ref={canvasRef}
                    />
                </Box>

                <Box>
                    <Box sx={{
                        color: lightText ? "rgb(255 255 255)" : "rgb(10 10 10)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: '"Roboto", roboto-condensed,sans-serif',
                        height: "100vh",
                    }}>

                        <Box sx={{
                            mixBlendMode: lightText ? "overlay" : "multiply",
                            margin: "auto",
                            display: "flex",
                            flexDirection: "column",
                            pt: 4
                        }}>
                            <Typography component={"h1"}
                                        sx={{
                                            fontWeight: 900,
                                            fontSize: "8rem",
                                            width: "100%",
                                            textAlign: "center",
                                            lineHeight: 1.1,
                                            m: 0
                                        }}>NEAT</Typography>

                            <Typography
                                component={"h2"}
                                sx={{
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                    width: "100%",
                                    textAlign: "center",
                                    textTransform: "uppercase",
                                }}>
                                Beautiful 3D gradient animations for your website
                            </Typography>
                        </Box>

                        <Button variant="contained"
                                sx={{ mt: 3 }}
                                onClick={handleDrawerOpen}>EDIT THIS GRADIENT</Button>

                        <Box sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            width: "540px",
                            p: 2,
                            maxWidth: "95vw",
                            zIndex: 1,
                        }}>

                            <Box
                                sx={{
                                    mt: 4,
                                    px: 4,
                                    py: 2,
                                    mixBlendMode: lightText ? "overlay" : "multiply",
                                    backgroundColor: lightText ? "rgba(0,0,0,.23)" : "rgba(255, 255, 255, 0.63)",
                                    borderRadius: 8,
                                }}>
                                <Box component={"p"}
                                     sx={{
                                         fontSize: "18px"
                                     }}>
                                    Neat is a <b>free tool</b> that generates beautiful
                                    gradient
                                    animations for your website.
                                    It's easy to use and offers a wide range of
                                    customization options.
                                </Box>

                                <Box component={"p"}
                                     sx={{
                                         mt: 4,
                                         fontSize: "18px"
                                     }}>
                                    Install the package using npm or yarn, following the instructions in the <a
                                    target={"_blank"}
                                    href="https://github.com/FireCMSco/neat">GitHub page</a> and please leave a star ⭐.
                                </Box>
                            </Box>

                            <Button
                                variant={"contained"}
                                component={"a"}
                                target={"_blank"}
                                color={"secondary"}
                                size={"large"}
                                href="https://github.com/FireCMSco/neat"
                                onClick={() => {
                                    logEvent(analytics, 'get_started');
                                }}
                                sx={{
                                    mt: 3,
                                    fontWeight: "bold",
                                }}>GET STARTED</Button>

                            <Box component={"p"}>
                                Built with ❤️ by <a rel={"noopener"}
                                                    href={"https://firecms.co"}>FireCMS</a>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

}
