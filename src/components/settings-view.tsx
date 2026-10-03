"use client";

import { useState } from "react";
import { Check, Download, FileJson, FileSpreadsheet, LogOut } from "lucide-react";

import { fullDate } from "@/lib/format";
import { FONT_STYLES, type FontStyle } from "@/lib/palette";
import { ViewHeading } from "@/components/views";

interface SettingsViewProps {
  user: { username: string; displayName: string | null; createdAt: string };
  fontStyle: FontStyle;
  onFontStyle: (style: FontStyle) => Promise<void>;
  stats: { stream: number; archive: number; trash: number; drawers: number };
  onLogout: () => void;
}

export function SettingsView({
  user,
  fontStyle,
  onFontStyle,
  stats,
  onLogout,
}: SettingsViewProps) {
  const [switching, setSwitching] = useState<FontStyle | null>(null);

  const pick = async (style: FontStyle) => {
    if (style === fontStyle || switching) return;
    setSwitching(style);
    await onFontStyle(style);
    setSwitching(null);
  };

  return (
    <div className="flex flex-col gap-7">
      <ViewHeading
        title="Settings"
        blurb="Tune the notepad to feel like yours."
      />

      {/* Font style */}
      <section>
        <SectionLabel>Font style</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5 max-[420px]:grid-cols-1">
          {FONT_STYLES.map((f) => {
            const active = fontStyle === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => void pick(f.key)}
                data-font={f.key}
                className={`relative flex flex-col items-start gap-1 rounded-2xl border bg-card p-4 text-left transition-all active:scale-[0.98] ${
                  active
                    ? "border-ink shadow-[0_10px_28px_-16px_rgba(26,26,26,0.35)]"
                    : "border-line hover:border-ink/25"
                }`}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-ink text-paper">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
                <span className="font-heading text-[30px] leading-none text-ink">
                  Aa
                </span>
                <span className="mt-1 text-[13px] font-semibold text-ink">
                  {f.label}
                </span>
                <span className="text-[11px] leading-snug text-muted">
                  {f.blurb}
                </span>
              </button>
            );
          })}
        </div>
        {switching && (
          <p className="mt-2 text-[12px] text-muted">Applying…</p>
        )}
      </section>

      {/* Export */}
      <section>
        <SectionLabel>Export your data</SectionLabel>
        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="text-[13px] leading-relaxed text-muted">
            Download every brain dump, drawer, and timestamp you own — yours
            forever, in open formats.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <a
              href="/api/export?format=json"
              download
              className="btn-ink flex h-9 items-center gap-2 px-4 text-[13px]"
            >
              <FileJson size={14} />
              JSON
            </a>
            <a
              href="/api/export?format=csv"
              download
              className="flex h-9 items-center gap-2 rounded-[10px] border border-ink/60 px-4 text-[13px] font-semibold text-ink transition-all hover:bg-ink hover:text-paper active:scale-97"
            >
              <FileSpreadsheet size={14} />
              CSV
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <SectionLabel>Your notebook at a glance</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat value={stats.stream} label="In stream" />
          <Stat value={stats.archive} label="Archived" />
          <Stat value={stats.trash} label="In trash" />
          <Stat value={stats.drawers} label="Drawers" />
        </div>
      </section>

      {/* Account */}
      <section>
        <SectionLabel>Account</SectionLabel>
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="font-heading flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[16px] font-semibold italic text-paper">
              {(user.displayName || user.username)[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-[14.5px] font-semibold text-ink">
                {user.displayName || user.username}
              </p>
              <p className="text-[12px] text-muted">
                @{user.username} · member since {fullDate(user.createdAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-line text-[13.5px] font-semibold text-[#a04a32] transition-all hover:border-[#a04a32]/40 hover:bg-[#f9ede9] active:scale-[0.99]"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 px-1 text-[11.5px] text-muted">
          <Download size={11} />
          Install ThoughtPad from your browser menu to use it full-screen like
          a native app.
        </p>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
      {children}
    </h2>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3.5">
      <p className="font-heading text-[26px] font-semibold leading-none tabular-nums text-ink">
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] text-muted">{label}</p>
    </div>
  );
}
