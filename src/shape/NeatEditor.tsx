import React, { useEffect, useRef } from "react";
import { NeatGradient } from "./NeatGradient";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Box, Slider, Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import { palettes } from "./palettes";
import { ColorSwatch } from "./ColowSwatch";


const palette = [
    "#ffb000",
    "#f5e1e5",
    "#6ef0ff",
    "#430be7",
]

const drawerWidth = 300;

const randomPalette = palettes[(Math.random() * palettes.length) | 0]

export default function NeatEditor() {

    const [drawerOpen, setDrawerOpen] = React.useState(true);

    const handleDrawerOpen = () => {
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
    };

    // const [color0, setColor0] = React.useState<string>(randomPalette[0]);
    // const [color1, setColor1] = React.useState<string>(randomPalette[1]);
    // const [color2, setColor2] = React.useState<string>(randomPalette[2]);
    // const [color3, setColor3] = React.useState<string>(randomPalette[3]);
    // const [color4, setColor4] = React.useState<string>(randomPalette[4]);

    const [color0, setColor0] = React.useState<string>("#FF5373");
    const [color1, setColor1] = React.useState<string>("#FFAF00");
    const [color2, setColor2] = React.useState<string>("#17E7FF");
    const [color3, setColor3] = React.useState<string>("#6D3BFF");
    const [color4, setColor4] = React.useState<string>("#f5e1e5");

    const [color0Enabled, setColor0Enabled] = React.useState<boolean>(true);
    const [color1Enabled, setColor1Enabled] = React.useState<boolean>(true);
    const [color2Enabled, setColor2Enabled] = React.useState<boolean>(true);
    const [color3Enabled, setColor3Enabled] = React.useState<boolean>(true);
    const [color4Enabled, setColor4Enabled] = React.useState<boolean>(true);

    const scrollRef = useRef<number>(0);

    const [speed, setSpeed] = React.useState<number>(4);
    const [horizontalPressure, setHorizontalPressure] = React.useState<number>(3);
    const [verticalPressure, setVerticalPressure] = React.useState<number>(3);

    const [shadows, setShadows] = React.useState<number>(0);
    const [saturation, setSaturation] = React.useState<number>(0);

    const [waveFrequency, setWaveFrequency] = React.useState<number>(5);
    const [waveAmplitude, setWaveAmplitude] = React.useState<number>(5);

    const handleColorChange = (newValue: string, setter: (value: string) => void) => {
        setter(typeof newValue === "string" ? newValue.toUpperCase() : newValue);
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

    function getColorsArray() {
        return [
            color0, color1, color2, color3, color4
        ].filter((_, i) => [color0Enabled, color1Enabled, color2Enabled, color3Enabled, color4Enabled][i]);
    }

    useEffect(() => {

        if (!canvasRef.current)
            return;

        gradientRef.current = new NeatGradient({
            ref: canvasRef.current,
            colors: getColorsArray(),
            speed,
            horizontalPressure,
            verticalPressure,
            waveFrequency,
            waveAmplitude
        });

        return gradientRef.current.destroy;

    }, [canvasRef.current]);

    const colors = getColorsArray();
    useEffect(() => {
        console.log(colors);
        if (gradientRef.current) {
            gradientRef.current.colors = colors;
            gradientRef.current.speed = speed;
            gradientRef.current.horizontalPressure = horizontalPressure;
            gradientRef.current.verticalPressure = verticalPressure;
            gradientRef.current.verticalPressure = verticalPressure;
            gradientRef.current.waveFrequency = waveFrequency;
            gradientRef.current.waveAmplitude = waveAmplitude;
            gradientRef.current.shadows = shadows;
            gradientRef.current.saturation = saturation;
        }
    }, [speed, horizontalPressure, verticalPressure, waveFrequency, waveAmplitude, colors, shadows, saturation]);

    return (
        <>

            <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{
                    m: 0,
                    position: "absolute",
                    left: 16,
                    top: 16,
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
                        backgroundColor: "#FFFFFF66",
                        overflowX: "scroll",
                        overflowY: "visible",
                        backdropFilter: "blur(12px)",

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
                            }}>
                    <ChevronLeftIcon/>
                </IconButton>

                <Box sx={{
                    mt: "64px",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    gap: 1,
                    overflow: "visible"

                }}>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 1,
                    }}>
                        <ColorSwatch
                            color={color0}
                            enabled={color0Enabled}
                            setEnabled={setColor0Enabled}
                            onChange={(color) => handleColorChange(color, setColor0)}/>
                        <ColorSwatch
                            color={color1}
                            enabled={color1Enabled}
                            setEnabled={setColor1Enabled}
                            onChange={(color) => handleColorChange(color, setColor1)}/>
                        <ColorSwatch
                            color={color2}
                            enabled={color2Enabled}
                            setEnabled={setColor2Enabled}
                            onChange={(color) => handleColorChange(color, setColor2)}/>
                        <ColorSwatch
                            color={color3}
                            enabled={color3Enabled}
                            setEnabled={setColor3Enabled}
                            onChange={(color) => handleColorChange(color, setColor3)}/>
                        <ColorSwatch
                            color={color4}
                            enabled={color4Enabled}
                            setEnabled={setColor4Enabled}
                            onChange={(color) => handleColorChange(color, setColor4)}/>
                    </Box>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        mt: 2
                    }}>
                        <Typography variant={"button"}
                                    gutterBottom
                                    sx={{ width: 80 }}>Speed</Typography>
                        <Slider
                            valueLabelDisplay="auto"
                            aria-label="speed"
                            value={speed}
                            size={"small"}
                            min={1}
                            max={9}
                            onChange={(event, newValue) => {
                                setSpeed(newValue as number)
                            }}
                        />
                    </Box>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        mt: 2
                    }}>

                        <Typography variant={"button"}
                                    gutterBottom>Pressure</Typography>
                        <Box sx={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 1,
                            alignItems: "flex-end"
                        }}>
                            <Typography gutterBottom
                                        variant={"caption"}
                                        sx={{ width: 80 }}>Horizontal </Typography>
                            <Slider
                                valueLabelDisplay="auto"
                                aria-label="horizontalPressure"
                                value={horizontalPressure}
                                size={"small"}
                                min={1}
                                max={5}
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
                                        gutterBottom sx={{ width: 80 }}>
                                Vertical
                            </Typography>
                            <Slider
                                valueLabelDisplay="auto"
                                aria-label="verticalPressure"
                                value={verticalPressure}
                                size={"small"}
                                min={1}
                                max={5}
                                onChange={(event, newValue) => {
                                    setVerticalPressure(newValue as number)
                                }}
                            />
                        </Box>
                    </Box>


                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        mt: 2
                    }}>

                        <Typography variant={"button"}
                                    gutterBottom>Wave</Typography>
                        <Box sx={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 1,
                            alignItems: "flex-end"
                        }}>
                            <Typography gutterBottom
                                        variant={"caption"}
                                        sx={{ width: 80 }}> Frequency</Typography>
                            <Slider
                                valueLabelDisplay="auto"
                                aria-label="waveFrequency"
                                value={waveFrequency}
                                size={"small"}
                                min={1}
                                max={9}
                                onChange={(event, newValue) => {
                                    setWaveFrequency(newValue as number)
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
                                        sx={{ width: 80 }}> Amplitude</Typography>
                            <Slider
                                valueLabelDisplay="auto"
                                aria-label="waveAmplitude"
                                value={waveAmplitude}
                                size={"small"}
                                min={0}
                                max={10}
                                onChange={(event, newValue) => {
                                    setWaveAmplitude(newValue as number)
                                }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        mt: 2
                    }}>

                        <Typography variant={"button"}
                                    gutterBottom>Color processing</Typography>
                        <Box sx={{
                            display: "flex",
                            flexDirection: "row",
                            gap: 1,
                            alignItems: "flex-end"
                        }}>
                            <Typography gutterBottom
                                        variant={"caption"}
                                        sx={{ width: 80 }}> Shadows</Typography>

                            <Slider
                                valueLabelDisplay="auto"
                                aria-label="shadows"
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
                                        sx={{ width: 80 }}>Saturation</Typography>
                            <Slider
                                valueLabelDisplay="auto"
                                aria-label="shadows"
                                value={saturation}
                                size={"small"}
                                min={-10}
                                max={10}
                                onChange={(event, newValue) => {
                                    setSaturation(newValue as number)
                                }}
                            />
                        </Box>
                    </Box>

                </Box>

            </Drawer>


            <Box sx={{
                position: "fixed",
                zIndex: -1,
                height: "100vh",
                width: "100vw",
            }}>
                <canvas
                    style={{
                        height: "100%",
                        width: "100%",
                    }}
                    ref={canvasRef}
                />
            </Box>
        </>
    );

}
