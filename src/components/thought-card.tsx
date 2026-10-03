"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  LoaderCircle,
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";

import { relativeTime } from "@/lib/format";
import type { DrawerDTO, ThoughtDTO } from "@/lib/types";
import { CheckCircle, DrawerBadge, paletteOf, DrawerIcon } from "@/components/ui";

export interface CardHandlers {
  onComplete: (t: ThoughtDTO) => void;
  onUncomplete: (t: ThoughtDTO) => void;
  onTrash: (t: ThoughtDTO) => void;
  onRestore: (t: ThoughtDTO) => void;
  onPermanentDelete: (t: ThoughtDTO) => void;
  onEdit: (id: string, content: string, drawerId?: string | null) => Promise<boolean>;
}

type Context = "stream" | "archive" | "trash";

function GhostButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90 ${
        danger
          ? "text-[#a04a32] hover:bg-[#f6e4de]"
          : "text-muted hover:bg-cream hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function ThoughtCard({
  thought,
  drawers,
  context,
  handlers,
}: {
  thought: ThoughtDTO;
  drawers: DrawerDTO[];
  context: Context;
  handlers: CardHandlers;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(thought.content);
  const [drawerPick, setDrawerPick] = useState<string | null | "auto">("auto");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const el = editRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
        el.style.height = "0px";
        el.style.height = `${el.scrollHeight + 2}px`;
      }
    }
  }, [editing]);

  const edited =
    new Date(thought.updatedAt).getTime() - new Date(thought.createdAt).getTime() >
    60_000;

  const saveEdit = async () => {
    if (!draft.trim() || saving) return;
    setSaving(true);
    const ok = await handlers.onEdit(
      thought.id,
      draft,
      drawerPick === "auto" ? undefined : drawerPick,
    );
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="group rounded-xl border border-line bg-card p-4 shadow-[0_1px_0_rgba(26,26,26,0.04)]"
    >
      {editing ? (
        /* ------------------------- inline editor ------------------------- */
        <div>
          <textarea
            ref={editRef}
            value={draft}
            dir="auto"
            onChange={(e) => {
              setDraft(e.target.value);
              const el = e.target;
              el.style.height = "0px";
              el.style.height = `${el.scrollHeight + 2}px`;
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void saveEdit();
              }
              if (e.key === "Escape") setEditing(false);
            }}
            maxLength={5000}
            className="w-full resize-none overflow-hidden rounded-lg border border-line bg-paper px-3 py-2 text-[15px] leading-relaxed text-ink outline-none focus:border-ink/40"
          />

          {/* Drawer re-assignment chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDrawerPick("auto")}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                drawerPick === "auto"
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-transparent text-muted hover:border-ink/30"
              }`}
            >
              <Sparkles size={10} />
              Auto-sort
            </button>
            {drawers.map((d) => {
              const active = drawerPick === d.id;
              const p = paletteOf(d.color);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDrawerPick(d.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    active ? "border-ink/60" : "border-transparent"
                  }`}
                  style={{
                    background: p.bg,
                    color: p.text,
                    opacity: active ? 1 : 0.55,
                  }}
                >
                  <DrawerIcon icon={d.icon} size={10} />
                  {d.name}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void saveEdit()}
              disabled={saving || !draft.trim()}
              className="btn-ink flex h-8 items-center gap-1.5 px-3.5 text-[12.5px]"
            >
              {saving && <LoaderCircle size={12} className="animate-spin" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(thought.content);
              }}
              className="h-8 rounded-lg px-3 text-[12.5px] font-medium text-muted transition-colors hover:bg-cream hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* --------------------------- read mode --------------------------- */
        <div className="flex gap-3">
          {context === "stream" && thought.isTask && (
            <CheckCircle
              checked={false}
              label="Check off → archive"
              onClick={() => handlers.onComplete(thought)}
            />
          )}

          <div className="min-w-0 flex-1">
            <p
              dir="auto"
              className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink"
            >
              {thought.content}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <DrawerBadge drawer={thought.drawer} />
              <span className="text-[11.5px] text-muted">
                {relativeTime(
                  context === "archive" && thought.completedAt
                    ? thought.completedAt
                    : thought.createdAt,
                )}
                {edited && " · edited"}
              </span>
              {thought.isTask && context === "stream" && (
                <span className="rounded-full border border-line px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Task
                </span>
              )}
            </div>
          </div>

          {/* Subtle top-right actions */}
          <div className="flex shrink-0 items-start gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {context === "stream" && (
              <>
                {confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => handlers.onTrash(thought)}
                    onMouseLeave={() => setConfirmDelete(false)}
                    className="h-7 rounded-lg bg-[#a04a32] px-2 text-[11px] font-semibold text-paper"
                  >
                    To trash?
                  </button>
                ) : (
                  <>
                    <GhostButton
                      label="Edit"
                      onClick={() => {
                        setDraft(thought.content);
                        setDrawerPick("auto");
                        setEditing(true);
                      }}
                    >
                      <Pencil size={13.5} />
                    </GhostButton>
                    {!thought.isTask && (
                      <GhostButton
                        label="Archive"
                        onClick={() => handlers.onComplete(thought)}
                      >
                        <Archive size={13.5} />
                      </GhostButton>
                    )}
                    <GhostButton
                      label="Delete"
                      danger
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 size={13.5} />
                    </GhostButton>
                  </>
                )}
              </>
            )}

            {context === "archive" && (
              <>
                <GhostButton
                  label="Unarchive"
                  onClick={() => handlers.onUncomplete(thought)}
                >
                  <RotateCcw size={13.5} />
                </GhostButton>
                <GhostButton
                  label="Move to trash"
                  danger
                  onClick={() => handlers.onTrash(thought)}
                >
                  <Trash2 size={13.5} />
                </GhostButton>
              </>
            )}

            {context === "trash" && (
              <>
                {confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => handlers.onPermanentDelete(thought)}
                    onMouseLeave={() => setConfirmDelete(false)}
                    className="h-7 rounded-lg bg-[#a04a32] px-2 text-[11px] font-semibold text-paper"
                  >
                    Wipe?
                  </button>
                ) : (
                  <>
                    <GhostButton
                      label="Restore"
                      onClick={() => handlers.onRestore(thought)}
                    >
                      <Undo2 size={13.5} />
                    </GhostButton>
                    <GhostButton
                      label="Delete forever"
                      danger
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 size={13.5} />
                    </GhostButton>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </motion.article>
  );
}
