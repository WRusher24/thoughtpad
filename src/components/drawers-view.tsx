"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  DRAWER_ICONS,
  DRAWER_PALETTE,
  PALETTE_KEYS,
} from "@/lib/palette";
import type { DrawerDTO } from "@/lib/types";
import { DrawerIcon, paletteOf } from "@/components/ui";
import { ViewHeading } from "@/components/views";

export interface DrawerHandlers {
  onCreate: (name: string, color: string, icon: string) => Promise<boolean>;
  onUpdate: (
    id: string,
    name: string,
    color: string,
    icon: string,
  ) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function ColorDot({
  colorKey,
  selected,
  onClick,
}: {
  colorKey: string;
  selected: boolean;
  onClick: () => void;
}) {
  const p = DRAWER_PALETTE[colorKey as keyof typeof DRAWER_PALETTE];
  return (
    <button
      type="button"
      aria-label={p.label}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90 ${
        selected ? "ring-[1.5px] ring-ink ring-offset-2 ring-offset-card" : ""
      }`}
      style={{ background: p.dot }}
    >
      {selected && <Check size={13} strokeWidth={3} className="text-paper" />}
    </button>
  );
}

function DrawerForm({
  initial,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: { name: string; color: string; icon: string };
  busy: boolean;
  submitLabel: string;
  onSubmit: (name: string, color: string, icon: string) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color);
  const [icon, setIcon] = useState(initial.icon);

  return (
    <div className="flex flex-col gap-3.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSubmit(name, color, icon);
          if (e.key === "Escape") onCancel?.();
        }}
        placeholder="Drawer name — e.g. Reading List"
        maxLength={32}
        className="input-ink"
      />
      <div className="flex flex-wrap items-center gap-2">
        {PALETTE_KEYS.map((k) => (
          <ColorDot
            key={k}
            colorKey={k}
            selected={color === k}
            onClick={() => setColor(k)}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {DRAWER_ICONS.map((k) => {
          const active = icon === k;
          const p = paletteOf(color);
          return (
            <button
              key={k}
              type="button"
              aria-label={k}
              onClick={() => setIcon(k)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all active:scale-90 ${
                active
                  ? "border-ink/50"
                  : "border-line hover:border-ink/25"
              }`}
              style={
                active
                  ? { background: p.bg, color: p.text }
                  : { color: "#8b887c" }
              }
            >
              <DrawerIcon icon={k} size={14} />
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => onSubmit(name, color, icon)}
          className="btn-ink flex h-9 items-center gap-1.5 px-4 text-[13px]"
        >
          {busy && <LoaderCircle size={13} className="animate-spin" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-cream hover:text-ink"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function DrawersView({
  drawers,
  handlers,
}: {
  drawers: DrawerDTO[];
  handlers: DrawerHandlers;
}) {
  const [creating, setCreating] = useState(false);
  const [busyCreate, setBusyCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyEdit, setBusyEdit] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <ViewHeading
        title="Brain Drawers"
        blurb="Smart categories. New dumps are auto-filed into the best fit."
        action={
          !creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="btn-ink flex h-9 items-center gap-1.5 px-3.5 text-[12.5px]"
            >
              <Plus size={13} strokeWidth={2.5} />
              New
            </button>
          )
        }
      />

      {creating && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-line bg-card p-4"
        >
          <DrawerForm
            initial={{ name: "", color: "sand", icon: "shapes" }}
            busy={busyCreate}
            submitLabel="Create drawer"
            onCancel={() => setCreating(false)}
            onSubmit={async (name, color, icon) => {
              setBusyCreate(true);
              const ok = await handlers.onCreate(name, color, icon);
              setBusyCreate(false);
              if (ok) setCreating(false);
            }}
          />
        </motion.div>
      )}

      <div className="flex flex-col gap-2.5">
        {drawers.map((d) => {
          const p = paletteOf(d.color);
          const editing = editingId === d.id;
          return (
            <motion.div
              key={d.id}
              layout
              className="rounded-2xl border border-line bg-card p-4"
            >
              {editing ? (
                <DrawerForm
                  initial={{ name: d.name, color: d.color, icon: d.icon }}
                  busy={busyEdit}
                  submitLabel="Save changes"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (name, color, icon) => {
                    setBusyEdit(true);
                    const ok = await handlers.onUpdate(d.id, name, color, icon);
                    setBusyEdit(false);
                    if (ok) setEditingId(null);
                  }}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: p.bg, color: p.text }}
                  >
                    <DrawerIcon icon={d.icon} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink">
                      {d.name}
                      {d.isSystem && (
                        <span className="ml-2 rounded-full border border-line px-2 py-[1.5px] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] tabular-nums text-muted">
                      {d.thoughtCount} thought{d.thoughtCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={`Edit ${d.name}`}
                      onClick={() => setEditingId(d.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream hover:text-ink"
                    >
                      <Pencil size={14} />
                    </button>
                    {!d.isSystem &&
                      (confirmId === d.id ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await handlers.onDelete(d.id);
                            setConfirmId(null);
                          }}
                          onMouseLeave={() => setConfirmId(null)}
                          className="flex h-8 items-center gap-1 rounded-lg bg-[#a04a32] px-2.5 text-[11.5px] font-semibold text-paper"
                        >
                          <Trash2 size={12} />
                          Sure?
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Delete ${d.name}`}
                          onClick={() => setConfirmId(d.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#f6e4de] hover:text-[#a04a32]"
                        >
                          <Trash2 size={14} />
                        </button>
                      ))}
                    {d.isSystem && (
                      <span className="flex h-8 w-8 items-center justify-center text-line">
                        <X size={13} />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="px-1 text-[12.5px] leading-relaxed text-muted">
        Deleting a drawer never deletes thoughts — they are re-filed into your
        Inbox automatically.
      </p>
    </div>
  );
}
