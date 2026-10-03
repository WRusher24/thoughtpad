"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Boxes,
  Briefcase,
  Check,
  Coffee,
  Dumbbell,
  Heart,
  Home,
  Inbox,
  Lightbulb,
  Music,
  PenLine,
  Plane,
  Shapes,
  ShoppingBasket,
  Sparkles,
  Star,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { DRAWER_PALETTE, type PaletteKey } from "@/lib/palette";
import type { DrawerDTO } from "@/lib/types";

export const ICON_MAP: Record<string, LucideIcon> = {
  shapes: Shapes,
  inbox: Inbox,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  "shopping-basket": ShoppingBasket,
  heart: Heart,
  star: Star,
  "book-open": BookOpen,
  music: Music,
  home: Home,
  dumbbell: Dumbbell,
  plane: Plane,
  wallet: Wallet,
  coffee: Coffee,
  sparkles: Sparkles,
  "pen-line": PenLine,
};

export function DrawerIcon({
  icon,
  size = 14,
  className,
  strokeWidth = 1.9,
}: {
  icon: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Cmp = ICON_MAP[icon] ?? Shapes;
  return <Cmp size={size} className={className} strokeWidth={strokeWidth} />;
}

export function paletteOf(color: string) {
  return DRAWER_PALETTE[color as PaletteKey] ?? DRAWER_PALETTE.sand;
}

export function DrawerBadge({
  drawer,
  onClick,
  className = "",
}: {
  drawer: { name: string; color: string; icon: string } | null;
  onClick?: () => void;
  className?: string;
}) {
  if (!drawer) return null;
  const p = paletteOf(drawer.color);
  const inner = (
    <>
      <span
        className="inline-block h-[5px] w-[5px] rounded-full"
        style={{ background: p.dot }}
      />
      {drawer.name}
    </>
  );
  const base = `inline-flex select-none items-center gap-1.5 rounded-full px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.09em] ${className}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} transition-transform active:scale-95`}
        style={{ background: p.bg, color: p.text }}
      >
        {inner}
      </button>
    );
  }
  return (
    <span className={base} style={{ background: p.bg, color: p.text }}>
      {inner}
    </span>
  );
}

/* ----------------------------------------------------------------------- */

export interface ToastData {
  key: number;
  text: string;
  drawer?: DrawerDTO | null;
  icon?: "check" | "boxes";
}

export function Toast({ toast }: { toast: ToastData | null }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="flex items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-medium text-paper shadow-[0_8px_30px_rgba(26,26,26,0.25)]"
          >
            {toast.icon === "check" ? (
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-paper/15">
                <Check size={11} strokeWidth={3} />
              </span>
            ) : (
              <Sparkles size={13} className="text-paper/70" />
            )}
            <span>{toast.text}</span>
            {toast.drawer && (
              <span className="flex items-center gap-1.5 rounded-full bg-paper/12 py-0.5 pl-2 pr-2.5 text-[11.5px] font-semibold">
                <span
                  className="h-[6px] w-[6px] rounded-full"
                  style={{ background: paletteOf(toast.drawer.color).dot }}
                />
                {toast.drawer.name}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-line bg-cream text-muted">
        <Icon size={22} strokeWidth={1.6} />
      </div>
      <p className="font-heading text-[19px] font-semibold italic text-ink">
        {title}
      </p>
      <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-muted">
        {body}
      </p>
    </motion.div>
  );
}

/** Ink circle checkbox used for task check-off. */
export function CheckCircle({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="group mt-[3px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink/35 transition-all duration-150 hover:border-ink active:scale-90"
    >
      <motion.span
        initial={false}
        animate={checked ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
        className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ink text-paper"
      >
        <Check size={12} strokeWidth={3.2} />
      </motion.span>
    </button>
  );
}

export const BoxesIcon = Boxes;
