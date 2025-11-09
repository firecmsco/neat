import * as React from "react";
import { cn } from "./utils";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "left";
  className?: string;
  children?: React.ReactNode;
}

export function Sheet({ open, onOpenChange, side = "right", className, children }: SheetProps) {
  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed top-0 h-full w-[360px] transition-transform z-30",
        side === "right" ? "right-0" : "left-0",
        open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full",
        className
      )}
    >
      {children}
    </div>
  );
}

