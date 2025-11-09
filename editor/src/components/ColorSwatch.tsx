import React from 'react'

import { ChromePicker, ColorResult } from "react-color";
import { NeatColor } from "@firecms/neat";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

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

    const handleChange = (colorResult: ColorResult) => {
        onChange({
            color: colorResult.hex.toUpperCase(),
            enabled: color.enabled
        });
    };

    return (
        <Popover open={displayColorPicker} onOpenChange={setDisplayColorPicker}>
            <PopoverTrigger asChild>
                <div
                    className={"rounded-lg cursor-pointer hover:outline hover:outline-4 hover:outline-primary border border-gray-100"}
                    style={{
                        width: '36px',
                        height: '36px',
                        background: color.enabled ? color.color : `repeating-linear-gradient(45deg, ${color.color}, ${color.color} 8px, #CCC 8px, #CCC 16px)`
                    }}/>
            </PopoverTrigger>
            <PopoverContent>
                <div className="bg-white rounded">
                    {showEnabled && (
                        <div className="flex items-center gap-2 mb-2">
                            <Label>Enabled</Label>
                            <Switch
                                checked={color.enabled}
                                onCheckedChange={(value) => {
                                    onChange({ color: color.color, enabled: value });
                                }}
                            />
                        </div>
                    )}
                    <ChromePicker disableAlpha={true}
                                  color={color.color}
                                  onChange={handleChange}/>
                </div>
            </PopoverContent>
        </Popover>
    );
}
