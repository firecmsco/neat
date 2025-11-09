import * as React from "react";
import { cn } from "./utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "text" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-white text-black hover:bg-white/90",
  outline: "border border-white/40 text-white hover:bg-white/10",
  text: "text-white hover:bg-white/10",
  ghost: "text-white hover:bg-white/10",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  secondary: "bg-gray-200 text-black hover:bg-gray-300"
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2 rounded-md",
  sm: "h-8 px-3 py-1 rounded-md text-sm",
  lg: "h-12 px-6 py-3 rounded-lg text-lg",
  icon: "h-9 w-9 p-0 rounded-full flex items-center justify-center"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

