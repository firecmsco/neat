import * as React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";

export function Tooltip({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <span>{children}</span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content sideOffset={6} className="z-50 rounded bg-black px-2 py-1 text-xs text-white shadow">
            {title}
            <RadixTooltip.Arrow className="fill-black" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
