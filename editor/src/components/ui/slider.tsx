import * as React from "react";
import * as RadixSlider from "@radix-ui/react-slider";

export interface SliderProps {
  value: [number];
  onValueChange: (value: [number]) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "small" | "default";
  className?: string;
  disabled?: boolean;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className, disabled = false }: SliderProps) {
  return (
    <RadixSlider.Root
      className={"relative flex w-full touch-none select-none items-center " + (className ?? "")}
      min={min}
      max={max}
      step={step}
      value={value}
      onValueChange={(v) => onValueChange([v[0]])}
      disabled={disabled}
    >
      <RadixSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/20">
        <RadixSlider.Range className="absolute h-full bg-white" />
      </RadixSlider.Track>
      <RadixSlider.Thumb className="block h-4 w-4 rounded-full border border-white/30 bg-white shadow" />
    </RadixSlider.Root>
  );
}
