import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "./utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <RadixDialog.Content className={cn(
          "fixed z-50 grid w-full max-w-[min(90vw,56rem)] max-h-[85vh] overflow-hidden gap-4 border border-white/10 bg-neutral-900 text-white p-6 shadow-2xl duration-200",
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg"
        )}>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixDialog.Title className={cn("text-xl font-semibold", className)}>
      {children}
    </RadixDialog.Title>
  );
}
export function DialogContent({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 overflow-auto pr-1 max-h-[60vh]">{children}</div>;
}
export function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-2 -mx-6 px-6 pt-3 border-t border-white/10 sticky bottom-0 bg-neutral-900/90 backdrop-blur flex items-center justify-end gap-2">{children}</div>;
}
