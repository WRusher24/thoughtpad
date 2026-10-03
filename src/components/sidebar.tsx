"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Boxes,
  Feather,
  LogOut,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { fullDate } from "@/lib/format";
import type { AppView, DrawerDTO } from "@/lib/types";
import { DrawerIcon, paletteOf } from "@/components/ui";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user: { username: string; displayName: string | null; createdAt: string };
  view: AppView;
  counts: { stream: number; archive: number; trash: number };
  drawers: DrawerDTO[];
  activeDrawerFilter: string | null;
  onNavigate: (view: AppView) => void;
  onFilterDrawer: (id: string | null) => void;
  onLogout: () => void;
}

function NavItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14.5px] transition-colors active:scale-[0.99] ${
        active
          ? "bg-ink font-semibold text-paper"
          : "text-ink-soft hover:bg-cream"
      }`}
    >
      <Icon size={17} strokeWidth={1.9} className={active ? "text-paper" : "text-muted"} />
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
            active ? "bg-paper/15 text-paper" : "bg-cream text-muted"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function Sidebar({
  open,
  onClose,
  user,
  view,
  counts,
  drawers,
  activeDrawerFilter,
  onNavigate,
  onFilterDrawer,
  onLogout,
}: SidebarProps) {
  const name = user.displayName || user.username;
  const initial = (name[0] ?? "T").toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px]"
          />
          <motion.aside
            key="panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[300px] max-w-[86vw] flex-col border-r border-line bg-paper"
            role="dialog"
            aria-label="Menu"
          >
            {/* User */}
            <div className="flex items-center gap-3 px-5 pb-5 pt-6">
              <div className="font-heading flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-[18px] font-semibold italic text-paper">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="font-heading truncate text-[17px] font-semibold leading-tight text-ink">
                  {name}
                </p>
                <p className="truncate text-[12px] text-muted">
                  @{user.username} · since {fullDate(user.createdAt).split(",")[0]}
                </p>
              </div>
            </div>

            <div className="mx-5 border-t border-line" />

            {/* Primary nav */}
            <nav className="flex flex-col gap-1 px-3 py-3">
              <NavItem
                icon={Feather}
                label="Stream of thoughts"
                count={counts.stream}
                active={view === "stream" && !activeDrawerFilter}
                onClick={() => {
                  onFilterDrawer(null);
                  onNavigate("stream");
                }}
              />
              <NavItem
                icon={Archive}
                label="Archive"
                count={counts.archive}
                active={view === "archive"}
                onClick={() => onNavigate("archive")}
              />
              <NavItem
                icon={Boxes}
                label="Brain Drawers"
                active={view === "drawers"}
                onClick={() => onNavigate("drawers")}
              />
              <NavItem
                icon={Trash2}
                label="Recently Deleted"
                count={counts.trash}
                active={view === "trash"}
                onClick={() => onNavigate("trash")}
              />
              <NavItem
                icon={SlidersHorizontal}
                label="Settings"
                active={view === "settings"}
                onClick={() => onNavigate("settings")}
              />
            </nav>

            <div className="mx-5 border-t border-line" />

            {/* Drawers quick filter */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
                Filter by drawer
              </p>
              <div className="flex flex-col gap-0.5">
                {drawers.map((d) => {
                  const active =
                    view === "stream" && activeDrawerFilter === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        onFilterDrawer(d.id);
                        onNavigate("stream");
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors ${
                        active
                          ? "bg-cream font-semibold text-ink"
                          : "text-ink-soft hover:bg-cream/70"
                      }`}
                    >
                      <span
                        className="flex h-[22px] w-[22px] items-center justify-center rounded-md"
                        style={{
                          background: paletteOf(d.color).bg,
                          color: paletteOf(d.color).text,
                        }}
                      >
                        <DrawerIcon icon={d.icon} size={12} />
                      </span>
                      <span className="flex-1 truncate">{d.name}</span>
                      {d.thoughtCount > 0 && (
                        <span className="text-[11px] tabular-nums text-muted">
                          {d.thoughtCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-line p-3">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink-soft transition-colors hover:bg-cream"
              >
                <LogOut size={16} className="text-muted" />
                Sign out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
