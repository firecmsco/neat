import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "./utils";

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Select({ value, onValueChange, className, children }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger className={cn("inline-flex items-center justify-between gap-2 rounded-md border border-white/30 bg-black/40 px-3 py-1 text-white", className)}>
        <span className="w-4 opacity-0 select-none">▾</span>
        <RadixSelect.Value className="truncate flex-1 text-center" />
        <RadixSelect.Icon className="w-4 text-right">▾</RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="z-50 rounded-md border border-white/20 bg-neutral-900 text-white backdrop-blur-md shadow">
          <RadixSelect.Viewport className="p-1">
            {children}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}
export function SelectItem({ value, className, children }: SelectItemProps) {
  return (
    <RadixSelect.Item value={value} className={cn("flex cursor-pointer select-none items-center rounded px-2 py-1 text-sm hover:bg-white/10", className)}>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}
