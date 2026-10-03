"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, LoaderCircle } from "lucide-react";

import { COMPOSER_PROMPTS } from "@/lib/palette";

interface ComposerProps {
  saving: boolean;
  onSave: (content: string) => Promise<boolean>;
}

export function Composer({ saving, onSave }: ComposerProps) {
  const [value, setValue] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const idleRef = useRef(false);

  // Zero-friction: focus the pad the moment the stream mounts.
  useEffect(() => {
    const t = setTimeout(() => areaRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  // Friendly rotating prompts; pauses while typing.
  useEffect(() => {
    const id = setInterval(() => {
      if (!idleRef.current) {
        setPromptIdx((i) => (i + 1) % COMPOSER_PROMPTS.length);
      }
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const autoresize = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(96, el.scrollHeight + 4)}px`;
  }, []);

  useEffect(autoresize, [value, autoresize]);

  const save = useCallback(async () => {
    const content = value.trim();
    if (!content || saving) return;
    const ok = await onSave(content);
    if (ok) {
      setValue("");
      requestAnimationFrame(() => {
        autoresize();
        areaRef.current?.focus();
      });
    }
  }, [value, saving, onSave, autoresize]);

  const canSave = value.trim().length > 0 && !saving;

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-[0_1px_0_rgba(26,26,26,0.05),0_16px_40px_-24px_rgba(26,26,26,0.25)]">
      <div className="relative">
        <textarea
          ref={areaRef}
          value={value}
          dir="auto"
          onChange={(e) => {
            idleRef.current = true;
            setValue(e.target.value);
          }}
          onBlur={() => {
            idleRef.current = false;
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void save();
            }
          }}
          rows={3}
          maxLength={5000}
          aria-label="Capture a thought"
          className="ruled-input w-full resize-none overflow-hidden bg-transparent pb-1 pl-0.5 pr-0.5 pt-[3px] text-[16px] text-ink outline-none placeholder:text-transparent md:text-[15.5px]"
          style={{ minHeight: 96 }}
        />
        {/* Animated rotating placeholder */}
        {value.length === 0 && (
          <div
            className="pointer-events-none absolute left-0.5 top-[3px] w-full"
            aria-hidden
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={promptIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="font-heading block text-[16.5px] italic leading-8 text-muted/80"
              >
                {COMPOSER_PROMPTS[promptIdx]}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canSave}
          className="btn-ink flex h-9 items-center gap-2 px-4 text-[13.5px]"
        >
          {saving ? <LoaderCircle size={14} className="animate-spin" /> : null}
          Save
        </button>
        <span className="hidden select-none items-center gap-1.5 text-[11.5px] text-muted sm:flex">
          <CornerDownLeft size={12} />
          Ctrl + Enter saves instantly
        </span>
        <span className="text-[11.5px] tabular-nums text-muted sm:hidden">
          {value.length > 0 ? `${value.trim().length}` : ""}
        </span>
      </div>
    </div>
  );
}
