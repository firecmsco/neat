import React from 'react'

import { ChromePicker, ColorResult } from "react-color";
import { NeatColor } from "@firecms/neat";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";

export function ColorSwatch({
                                color,
                                showEnabled = false,
                                showInfluence = false,
                                onChange,
                            }: {
    color: NeatColor,
    onChange: (color: NeatColor) => void,
    showEnabled?: boolean,
    /**
     * Influence is meaningless on the first colour — it is the base the others are
     * mixed over, so it is always fully present.
     */
    showInfluence?: boolean,
}) {

    const [displayColorPicker, setDisplayColorPicker] = React.useState(false);

    // Spread the existing colour rather than rebuilding it: these handlers used to
    // return a fresh { color, enabled } and would now silently drop influence.
    const handleChange = (colorResult: ColorResult) => {
        onChange({ ...color, color: colorResult.hex.toUpperCase() });
    };

    const influence = color.influence ?? 1;

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
                                    onChange({ ...color, enabled: value });
                                }}
                            />
                        </div>
                    )}
                    <ChromePicker disableAlpha={true}
                                  color={color.color}
                                  onChange={handleChange}/>
                    {showInfluence && (
                        <div className={`mt-3 px-1 pb-1 ${color.enabled ? "" : "opacity-40 pointer-events-none"}`}>
                            <div className="flex items-baseline justify-between mb-1">
                                <Label className="text-xs">Influence</Label>
                                <span className="text-[10px] text-neutral-500 tabular-nums">
                                    {influence.toFixed(2)}
                                </span>
                            </div>
                            <Slider
                                value={[influence]}
                                min={0} max={2} step={0.05} resetValue={1}
                                disabled={!color.enabled}
                                onValueChange={(v) => onChange({ ...color, influence: v[0] as number })}
                            />
                            <p className="text-[10px] leading-snug text-neutral-500 mt-1">
                                How much canvas this colour claims. 1 is neutral, 0 removes it.
                            </p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
