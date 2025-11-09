import * as React from "react";
import * as RadixPopover from "@radix-ui/react-popover";

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <RadixPopover.Portal>
    <RadixPopover.Content className={(className ?? "") + " z-50 bg-white text-black rounded-md shadow-lg p-2 border border-black/10"}>
      {children}
      <RadixPopover.Arrow className="fill-white" />
    </RadixPopover.Content>
  </RadixPopover.Portal>
);

