import * as React from "react";
import * as RadixSwitch from "@radix-ui/react-switch";

export function Switch({ checked, onCheckedChange, className }: { checked: boolean; onCheckedChange: (v: boolean)=>void; className?: string }) {
  return (
    <RadixSwitch.Root
      className={(className ?? "") + " inline-flex h-6 w-10 items-center rounded-full bg-black/30 data-[state=checked]:bg-green-500/70"}
      checked={checked}
      onCheckedChange={onCheckedChange}
    >
      <RadixSwitch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-4" />
    </RadixSwitch.Root>
  );
}

