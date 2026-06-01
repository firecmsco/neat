import * as React from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { RotateCcw } from "lucide-react";

export interface SliderProps {
  value: [number];
  onValueChange: (value: [number]) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: "small" | "default";
  className?: string;
  disabled?: boolean;
  resetValue?: number;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled = false,
  resetValue,
}: SliderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (isDragging) {
      const handlePointerUp = () => setIsDragging(false);
      window.addEventListener("pointerup", handlePointerUp);
      return () => window.removeEventListener("pointerup", handlePointerUp);
    }
    return;
  }, [isDragging]);

  const showTooltip = (isDragging || isHovered) && !disabled;
  const displayValue = Math.round(value[0] * 100) / 100;

  const hasReset = resetValue !== undefined;
  const isModified = hasReset && value[0] !== resetValue;

  const sliderRoot = (
    <RadixSlider.Root
      className={"relative flex w-full touch-none select-none items-center " + (hasReset ? "" : (className ?? "")) || ""}
      min={min}
      max={max}
      step={step}
      value={value}
      onValueChange={(v) => {
        let val = v[0];
        if (min < 0 && max > 0) {
          if (Math.abs(val) < step * 0.9) {
            val = 0;
          }
        }
        onValueChange([val]);
      }}
      disabled={disabled}
      onPointerDown={() => {
        if (!disabled) setIsDragging(true);
      }}
    >
      <RadixSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/20">
        <RadixSlider.Range className="absolute h-full bg-white" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="relative block h-4 w-4 rounded-full border border-white/30 bg-white shadow outline-none focus:ring-2 focus:ring-white/50 cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-1.5 py-0.5 text-[10px] font-medium bg-black/95 border border-white/10 text-white rounded shadow-lg pointer-events-none whitespace-nowrap z-50 transition-all select-none">
            {displayValue}
          </div>
        )}
      </RadixSlider.Thumb>
    </RadixSlider.Root>
  );

  if (hasReset) {
    return (
      <div className={"flex items-center gap-1.5 w-full " + (className ?? "")}>
        {sliderRoot}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {isModified && (
            <button
              onClick={() => onValueChange([resetValue])}
              className="text-white/40 hover:text-white transition-colors p-0.5"
              title={`Reset to ${resetValue}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return sliderRoot;
}

