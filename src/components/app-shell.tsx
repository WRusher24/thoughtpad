"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  completeThought,
  createThought,
  emptyTrash,
  getMoreThoughts,
  getThoughtsByDrawer,
  permanentlyDeleteThought,
  restoreThought,
  searchThoughts,
  trashThought,
  uncompleteThought,
  updateThought,
  type ThoughtView,
} from "@/actions/thoughts";
import {
  createDrawer,
  deleteDrawer,
  updateDrawer,
} from "@/actions/drawers";
import { updateFontStyle } from "@/actions/settings";
import { logout } from "@/actions/auth";
import { greeting } from "@/lib/format";
import { PAGE_SIZE, type AppView, type DrawerDTO, type InitialData, type ThoughtDTO } from "@/lib/types";
import type { FontStyle } from "@/lib/palette";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { StreamView, ArchiveView, TrashView } from "@/components/views";
import { DrawersView } from "@/components/drawers-view";
import { SettingsView } from "@/components/settings-view";
import { Toast, type ToastData } from "@/components/ui";
import type { CardHandlers } from "@/components/thought-card";

type Counts = { stream: number; archive: number; trash: number };

function viewOf(t: ThoughtDTO): ThoughtView {
  if (t.deletedAt) return "trash";
  if (t.completedAt) return "archive";
  return "stream";
}

function mergeThoughts(store: ThoughtDTO[], incoming: ThoughtDTO[]): ThoughtDTO[] {
  const byId = new Map(store.map((t) => [t.id, t]));
  for (const t of incoming) byId.set(t.id, t);
  return [...byId.values()];
}

export function AppShell({ initialData }: { initialData: InitialData }) {
  const [view, setView] = useState<AppView>("stream");
  const [thoughts, setThoughts] = useState<ThoughtDTO[]>(initialData.thoughts);
  const [drawers, setDrawers] = useState<DrawerDTO[]>(initialData.drawers);
  const [counts, setCounts] = useState<Counts>(initialData.counts);
  const [fontStyle, setFontStyle] = useState<FontStyle>(initialData.fontStyle);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ThoughtDTO[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [drawerFilter, setDrawerFilter] = useState<string | null>(null);
  const [loadedPages, setLoadedPages] = useState({ stream: 1, archive: 0, trash: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emptying, setEmptying] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, opts?: Partial<ToastData>) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ key: Date.now(), text, ...opts });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  /* ------------------------------ derived ------------------------------ */

  const streamThoughts = useMemo(
    () =>
      thoughts
        .filter((t) => viewOf(t) === "stream")
        .filter((t) => !drawerFilter || t.drawerId === drawerFilter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [thoughts, drawerFilter],
  );

  const archiveThoughts = useMemo(
    () =>
      thoughts
        .filter((t) => viewOf(t) === "archive")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [thoughts],
  );

  const trashThoughts = useMemo(
    () =>
      thoughts
        .filter((t) => viewOf(t) === "trash")
        .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [thoughts],
  );

  const activeFilterDrawer = drawerFilter
    ? (drawers.find((d) => d.id === drawerFilter) ?? null)
    : null;

  /* --------------------------- state changes --------------------------- */

  const applyTransition = useCallback((next: ThoughtDTO) => {
    setThoughts((prev) => {
      const old = prev.find((t) => t.id === next.id);
      if (!old) return [next, ...prev];
      setCounts((c) => ({
        ...c,
        [viewOf(old)]: Math.max(0, c[viewOf(old)] - 1),
        [viewOf(next)]: c[viewOf(next)] + 1,
      }));
      const merged = prev.map((t) => (t.id === next.id ? next : t));
      return merged;
    });
  }, []);

  const bumpDrawerCount = useCallback(
    (fromDrawerId: string | null, toDrawerId: string | null) => {
      if (fromDrawerId === toDrawerId) return;
      setDrawers((prev) =>
        prev.map((d) =>
          d.id === fromDrawerId
            ? { ...d, thoughtCount: Math.max(0, d.thoughtCount - 1) }
            : d.id === toDrawerId
              ? { ...d, thoughtCount: d.thoughtCount + 1 }
              : d,
        ),
      );
    },
    [],
  );

  /* ----------------------------- handlers ------------------------------ */

  const handleSave = useCallback(
    async (content: string) => {
      setSaving(true);
      const res = await createThought(content);
      setSaving(false);
      if (res.error || !res.thought) {
        showToast(res.error ?? "Couldn't save that thought.");
        return false;
      }
      setThoughts((prev) => [res.thought!, ...prev]);
      setCounts((c) => ({ ...c, stream: c.stream + 1 }));
      bumpDrawerCount(null, res.thought.drawerId);
      showToast("Saved — filed away for you.", {
        drawer: res.thought.drawer
          ? drawers.find((d) => d.id === res.thought!.drawer!.id) ?? null
          : null,
      });
      return true;
    },
    [showToast, drawers, bumpDrawerCount],
  );

  const handleEdit = useCallback(
    async (id: string, content: string, drawerId?: string | null) => {
      const before = thoughts.find((t) => t.id === id);
      const res = await updateThought(id, content, drawerId);
      if (res.error || !res.thought) {
        showToast(res.error ?? "Couldn't update that thought.");
        return false;
      }
      setThoughts((prev) => prev.map((t) => (t.id === id ? res.thought! : t)));
      if (viewOf(res.thought) === "stream") {
        bumpDrawerCount(before?.drawerId ?? null, res.thought.drawerId);
      }
      showToast("Updated.");
      return true;
    },
    [thoughts, showToast, bumpDrawerCount],
  );

  const cardHandlers: CardHandlers = useMemo(
    () => ({
      onComplete: async (t) => {
        const res = await completeThought(t.id);
        if (res.thought) {
          applyTransition(res.thought);
          bumpDrawerCount(t.drawerId, null);
          showToast("Checked off → Archive", { icon: "check" });
        }
      },
      onUncomplete: async (t) => {
        const res = await uncompleteThought(t.id);
        if (res.thought) {
          applyTransition(res.thought);
          bumpDrawerCount(null, t.drawerId);
          showToast("Back in your stream.");
        }
      },
      onTrash: async (t) => {
        const res = await trashThought(t.id);
        if (res.thought) {
          applyTransition(res.thought);
          if (!t.completedAt) bumpDrawerCount(t.drawerId, null);
          showToast("Moved to Recently Deleted.");
        }
      },
      onRestore: async (t) => {
        const res = await restoreThought(t.id);
        if (res.thought) {
          applyTransition(res.thought);
          bumpDrawerCount(null, t.drawerId);
          showToast("Restored to your stream.", { icon: "check" });
        }
      },
      onPermanentDelete: async (t) => {
        const res = await permanentlyDeleteThought(t.id);
        if (res.ok) {
          setThoughts((prev) => prev.filter((x) => x.id !== t.id));
          setCounts((c) => ({ ...c, trash: Math.max(0, c.trash - 1) }));
          showToast("Wiped for good.");
        }
      },
      onEdit: handleEdit,
    }),
    [applyTransition, bumpDrawerCount, showToast, handleEdit],
  );

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return;
    const current: ThoughtView =
      view === "archive" ? "archive" : view === "trash" ? "trash" : "stream";
    setLoadingMore(true);
    const offset =
      current === "stream"
        ? streamThoughts.length
        : current === "archive"
          ? archiveThoughts.length
          : trashThoughts.length;
    const older = await getMoreThoughts(current, offset);
    setThoughts((prev) => mergeThoughts(prev, older));
    setLoadedPages((p) => ({ ...p, [current]: p[current] + 1 }));
    setLoadingMore(false);
  }, [loadingMore, view, streamThoughts.length, archiveThoughts.length, trashThoughts.length]);

  const hasMore = (current: ThoughtView, loaded: number) =>
    loaded < counts[current] && loadedPages[current] * PAGE_SIZE >= PAGE_SIZE;

  /* ------------------------------ drawers ------------------------------ */

  const drawerHandlers = useMemo(
    () => ({
      onCreate: async (name: string, color: string, icon: string) => {
        const res = await createDrawer(name, color, icon);
        if (res.error || !res.drawer) {
          showToast(res.error ?? "Couldn't create drawer.");
          return false;
        }
        setDrawers((prev) => [...prev, res.drawer!]);
        showToast(`Drawer "${res.drawer.name}" created.`, { icon: "check" });
        return true;
      },
      onUpdate: async (id: string, name: string, color: string, icon: string) => {
        const res = await updateDrawer(id, name, color, icon);
        if (res.error || !res.drawer) {
          showToast(res.error ?? "Couldn't update drawer.");
          return false;
        }
        setDrawers((prev) =>
          prev.map((d) =>
            d.id === id ? { ...res.drawer!, thoughtCount: d.thoughtCount } : d,
          ),
        );
        setThoughts((prev) =>
          prev.map((t) =>
            t.drawerId === id
              ? { ...t, drawer: { id, name, color, icon } }
              : t,
          ),
        );
        showToast("Drawer updated.", { icon: "check" });
        return true;
      },
      onDelete: async (id: string) => {
        const res = await deleteDrawer(id);
        if (!res.ok) {
          showToast(res.error ?? "Couldn't delete drawer.");
          return false;
        }
        setDrawers((prev) =>
          prev
            .filter((d) => d.id !== id)
            .map((d) =>
              d.id === res.inboxDrawer?.id
                ? { ...d, thoughtCount: res.inboxDrawer.thoughtCount }
                : d,
            ),
        );
        setThoughts((prev) =>
          prev.map((t) =>
            t.drawerId === id && res.inboxDrawer
              ? {
                  ...t,
                  drawerId: res.inboxDrawer.id,
                  drawer: {
                    id: res.inboxDrawer.id,
                    name: res.inboxDrawer.name,
                    color: res.inboxDrawer.color,
                    icon: res.inboxDrawer.icon,
                  },
                }
              : t,
          ),
        );
        if (drawerFilter === id) setDrawerFilter(null);
        showToast("Drawer removed — thoughts moved to Inbox.");
        return true;
      },
    }),
    [showToast, drawerFilter],
  );

  /* ------------------------------ settings ----------------------------- */

  const handleFontStyle = useCallback(
    async (style: FontStyle) => {
      setFontStyle(style);
      await updateFontStyle(style);
      showToast("Font updated.", { icon: "check" });
    },
    [showToast],
  );

  const handleEmptyTrash = useCallback(async () => {
    setEmptying(true);
    const res = await emptyTrash();
    setEmptying(false);
    if (res.ok) {
      setThoughts((prev) => prev.filter((t) => !t.deletedAt));
      setCounts((c) => ({ ...c, trash: 0 }));
      showToast(`Trash emptied — ${res.removed} wiped.`);
    }
  }, [showToast]);

  /* ------------------------------- search ------------------------------ */

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = setTimeout(async () => {
      const results = await searchThoughts(q);
      setSearchResults(results);
      setSearching(false);
    }, 280);
    return () => clearTimeout(id);
  }, [searchQuery]);

  /* ---------------------------- drawer filter -------------------------- */

  useEffect(() => {
    if (!drawerFilter) return;
    let alive = true;
    void (async () => {
      const rows = await getThoughtsByDrawer(drawerFilter);
      if (alive) setThoughts((prev) => mergeThoughts(prev, rows));
    })();
    return () => {
      alive = false;
    };
  }, [drawerFilter]);

  /* ------------------------------- render ------------------------------ */

  const dateLine = new Intl.DateTimeFormat("en-US-u-nu-latn", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div data-font={fontStyle} className="paper-grain font-body min-h-dvh">
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        searchOpen={searchOpen}
        onSearchOpen={(open) => {
          setSearchOpen(open);
          if (open && view !== "stream") setView("stream");
          if (!open) setSearchQuery("");
        }}
        query={searchQuery}
        onQuery={setSearchQuery}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={initialData.user}
        view={view}
        counts={counts}
        drawers={drawers}
        activeDrawerFilter={drawerFilter}
        onNavigate={(v) => {
          setView(v);
          setSidebarOpen(false);
        }}
        onFilterDrawer={setDrawerFilter}
        onLogout={() => void logout()}
      />

      <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-5 sm:px-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view + (drawerFilter ?? "") + (searchQuery ? "q" : "")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {view === "stream" && (
              <StreamView
                greetingTitle={`${greeting()}, ${initialData.user.displayName || initialData.user.username}.`}
                dateLine={dateLine}
                saving={saving}
                onSave={handleSave}
                thoughts={streamThoughts}
                drawers={drawers}
                handlers={cardHandlers}
                hasMore={hasMore("stream", streamThoughts.length)}
                loadingMore={loadingMore}
                onLoadMore={() => void handleLoadMore()}
                drawerFilter={activeFilterDrawer}
                onClearFilter={() => setDrawerFilter(null)}
                searchQuery={searchQuery}
                searchResults={searchResults}
                searching={searching}
              />
            )}
            {view === "archive" && (
              <ArchiveView
                thoughts={archiveThoughts}
                drawers={drawers}
                handlers={cardHandlers}
                hasMore={hasMore("archive", archiveThoughts.length)}
                loadingMore={loadingMore}
                onLoadMore={() => void handleLoadMore()}
              />
            )}
            {view === "trash" && (
              <TrashView
                thoughts={trashThoughts}
                drawers={drawers}
                handlers={cardHandlers}
                hasMore={hasMore("trash", trashThoughts.length)}
                loadingMore={loadingMore}
                onLoadMore={() => void handleLoadMore()}
                onEmptyTrash={() => void handleEmptyTrash()}
                emptying={emptying}
              />
            )}
            {view === "drawers" && (
              <DrawersView drawers={drawers} handlers={drawerHandlers} />
            )}
            {view === "settings" && (
              <SettingsView
                user={initialData.user}
                fontStyle={fontStyle}
                onFontStyle={handleFontStyle}
                stats={{
                  stream: counts.stream,
                  archive: counts.archive,
                  trash: counts.trash,
                  drawers: drawers.length,
                }}
                onLogout={() => void logout()}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Toast toast={toast} />
    </div>
  );
}
