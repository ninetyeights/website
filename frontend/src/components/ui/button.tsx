"use client";

import { useRef, useState } from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "button-elastic group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50  disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4 max-md:min-h-11",
        xs: "h-8 gap-1 px-3 text-xs max-md:min-h-11",
        sm: "h-8 gap-2 px-3 text-[13px] max-md:min-h-11",
        lg: "h-12 gap-2 px-5 text-base",
        icon: "size-10 max-md:size-11",
        "icon-xs": "size-8 max-md:size-11",
        "icon-sm": "size-8 max-md:size-11",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  onClick,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const sequence = useRef(0);
  const [waves, setWaves] = useState<{ id: number; x: number; y: number; diameter: number }[]>([]);
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), "button-wave", className)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || props.disabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.detail === 0 ? rect.width / 2 : event.clientX - rect.left;
        const y = event.detail === 0 ? rect.height / 2 : event.clientY - rect.top;
        const diameter = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) * 2;
        setWaves(previous => [...previous.slice(-3), { id: ++sequence.current, x, y, diameter }]);
      }}
    >
      {children}
      {waves.map(wave => <span key={wave.id} aria-hidden="true" className="button-wave-ring" style={{ left: wave.x - wave.diameter / 2, top: wave.y - wave.diameter / 2, width: wave.diameter, height: wave.diameter, animationDuration: `${Math.min(620, Math.max(400, wave.diameter * 1.92))}ms` }} onAnimationEnd={() => setWaves(previous => previous.filter(item => item.id !== wave.id))} />)}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
