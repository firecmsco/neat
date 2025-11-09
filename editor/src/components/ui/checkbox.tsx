import * as React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({ checked, onCheckedChange, onChange, className }: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      checked={checked}
      onCheckedChange={(v) => {
        const bool = Boolean(v);
        if (onCheckedChange) onCheckedChange(bool);
        if (onChange) onChange(bool);
      }}
      className={(className ?? "") + " h-4 w-4 rounded border border-white/40 bg-transparent data-[state=checked]:bg-white/90 grid place-items-center"}
    >
      <RadixCheckbox.Indicator>
        <svg className="h-3 w-3 text-black" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.285 6.708a1 1 0 00-1.57-1.248l-8.19 10.3-4.24-4.24a1 1 0 10-1.414 1.415l5 5a1 1 0 001.52-.083l8.894-11.144z" />
        </svg>
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
