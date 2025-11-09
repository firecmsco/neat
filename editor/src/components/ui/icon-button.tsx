import * as React from "react";
import { cn } from "./utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function IconButton({ className, ...props }: IconButtonProps) {
  return (
    <button className={cn("h-9 w-9 p-0 rounded-full flex items-center justify-center hover:bg-white/10", className)} {...props} />
  );
}

