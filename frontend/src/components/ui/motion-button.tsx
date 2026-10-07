"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MotionButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: ReactNode;
  previewFullMotion?: boolean;
};

/** A primary action with spring feedback; native button semantics are retained. */
export function MotionButton({ children, previewFullMotion = false, className, disabled, onClick, onPointerMove, onPointerLeave, type = "button", ...props }: MotionButtonProps) {
  const systemReduced = useReducedMotion();
  const reduced = systemReduced && !previewFullMotion;
  const [hovered, setHovered] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const sequence = useRef(0);
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const x = useSpring(pointerX, { stiffness: 220, damping: 25 });
  const y = useSpring(pointerY, { stiffness: 220, damping: 25 });
  const glow = useMotionTemplate`radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,.32), transparent 65%)`;
  const animate = !disabled && !reduced;

  return <motion.button
    {...props}
    type={type}
    disabled={disabled}
    className={cn(buttonVariants({ size: "lg" }).replace("button-elastic", ""), "relative isolate overflow-hidden shadow-sm", className)}
    initial={false}
    animate={{ scale: 1, y: 0 }}
    whileTap={animate ? { scale: .95, y: 1 } : undefined}
    transition={{ type: "spring", stiffness: 420, damping: 19, mass: .65 }}
    onHoverStart={() => { if (!disabled) setHovered(true); }}
    onHoverEnd={() => setHovered(false)}
    onPointerMove={(event) => {
      if (animate && event.pointerType === "mouse") {
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set((event.clientX - rect.left) / rect.width * 100);
        pointerY.set((event.clientY - rect.top) / rect.height * 100);
      }
      onPointerMove?.(event);
    }}
    onPointerLeave={(event) => { pointerX.set(50); pointerY.set(50); onPointerLeave?.(event); }}
    onClick={(event) => {
      if (disabled) return;
      if (!reduced) {
        const rect = event.currentTarget.getBoundingClientRect();
        const ripple = { id: ++sequence.current, x: event.detail === 0 ? rect.width / 2 : event.clientX - rect.left, y: event.detail === 0 ? rect.height / 2 : event.clientY - rect.top, size: Math.hypot(rect.width, rect.height) * 2 };
        setRipples(previous => [...previous.slice(-3), ripple]);
      }
      onClick?.(event);
    }}
  >
    <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: glow }} animate={{ opacity: animate && hovered ? 1 : 0 }} transition={{ duration: reduced ? 0 : .18 }} />
    <motion.span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] border border-white/30" animate={{ opacity: hovered && !disabled ? 1 : .3 }} transition={{ duration: reduced ? 0 : .2 }} />
    {!reduced && !disabled && ripples.map(ripple => <motion.span
      aria-hidden="true" key={ripple.id}
      className="pointer-events-none absolute rounded-full bg-white/25"
      style={{ left: ripple.x - ripple.size / 2, top: ripple.y - ripple.size / 2, width: ripple.size, height: ripple.size }}
      initial={{ scale: 0, opacity: .7 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: .55, ease: "easeOut" }}
      onAnimationComplete={() => setRipples(previous => previous.filter(item => item.id !== ripple.id))}
    />)}
    <span className="relative z-10">{children}</span>
    <motion.span aria-hidden="true" className="relative z-10 inline-flex" animate={{ x: animate && hovered ? 3 : 0, y: animate && hovered ? -2 : 0, rotate: animate && hovered ? 8 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}><ArrowUpRight size={18}/></motion.span>
  </motion.button>;
}
