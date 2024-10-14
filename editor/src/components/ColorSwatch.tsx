import React from 'react'

import { BooleanSwitchWithLabel, Popover, Typography } from "@firecms/ui";
import { ChromePicker, ColorResult } from "react-color";
import { NeatColor } from "@firecms/neat";

export function ColorSwatch({
                                color,
                                showEnabled = false,
                                onChange,
                            }: {
    color: NeatColor,
    onChange: (color: NeatColor) => void,
    showEnabled?: boolean,
}) {

    const [displayColorPicker, setDisplayColorPicker] = React.useState(false);

    const handleClick = () => {
        setDisplayColorPicker(!displayColorPicker);
    };

    const handleClose = () => {
        setDisplayColorPicker(false);
    };

    const handleChange = (colorResult: ColorResult) => {
        onChange({
            color: colorResult.hex.toUpperCase(),
            enabled: color.enabled
        });
    };

    return <Popover
        modal={true}
        trigger={<div
            className={"rounded-lg cursor-pointer hover:outline hover:outline-4 hover:outline-primary border border-gray-100"}
            style={{
                width: '36px',
                height: '36px',
                background: color.enabled ? color.color : `repeating-linear-gradient(
                                                                45deg,
                                                        ${color.color},
                                                        ${color.color} 8px,
                                                        #CCC 8px,
                                                        #CCC 16px
                                                        )`
            }}/>}
        open={displayColorPicker}
        onOpenChange={setDisplayColorPicker}
    >


        <div className="bg-white rounded shadow">
            {showEnabled && <BooleanSwitchWithLabel value={color.enabled}
                                                    className={"outline-0"}
                                                    size={"small"}
                                                    onValueChange={(value) => {
                                                        onChange({
                                                            color: color.color,
                                                            enabled: value
                                                        })
                                                    }}
                                                    label={<Typography
                                                        variant={"button"}>Enabled</Typography>}/>}

            <ChromePicker disableAlpha={true}
                          color={color.color}
                          onChange={handleChange}/>
        </div>


    </Popover>;
    // return (<>
    //         <Box>
    //             <Box sx={{
    //                 padding: '4px',
    //                 // background: '#fff',
    //                 borderRadius: '2px',
    //                 boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
    //                 display: 'inline-block',
    //                 cursor: 'pointer',
    //             }} onClick={handleClick}>
    //                 <div style={{
    //                     width: '36px',
    //                     height: '36px',
    //                     borderRadius: '2px',
    //                     background: color.enabled ? color.color : `repeating-linear-gradient(
    //                                                             45deg,
    //                                                     ${color.color},
    //                                                     ${color.color} 8px,
    //                                                     #CCC 8px,
    //                                                     #CCC 16px
    //                                                     )`
    //                 }}/>
    //             </Box>
    //
    //
    //         </Box>
    //
    //         <Portal>
    //             {displayColorPicker && <Box sx={{
    //                 position: 'absolute',
    //                 zIndex: 1300,
    //             }}></Box>}
    //
    //         </Portal>
    //
    //     </>
    // )
}
