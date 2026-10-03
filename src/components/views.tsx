"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Feather,
  LoaderCircle,
  SearchX,
  Trash2,
} from "lucide-react";

import type { DrawerDTO, ThoughtDTO } from "@/lib/types";
import { Composer } from "@/components/composer";
import { ThoughtCard, type CardHandlers } from "@/components/thought-card";
import { EmptyState, DrawerBadge } from "@/components/ui";

function LoadMore({
  visible,
  loading,
  onClick,
}: {
  visible: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  if (!visible) return null;
  return (
    <div className="flex justify-center pt-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[12.5px] font-medium text-ink-soft transition-all hover:border-ink/30 active:scale-97"
      >
        {loading && <LoaderCircle size={13} className="animate-spin" />}
        Load older thoughts
      </button>
    </div>
  );
}

function List({
  items,
  context,
  drawers,
  handlers,
}: {
  items: ThoughtDTO[];
  context: "stream" | "archive" | "trash";
  drawers: DrawerDTO[];
  handlers: CardHandlers;
}) {
  return (
    <motion.div layout className="flex flex-col gap-2.5">
      <AnimatePresence mode="popLayout">
        {items.map((t) => (
          <ThoughtCard
            key={t.id}
            thought={t}
            drawers={drawers}
            context={context}
            handlers={handlers}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

/* ----------------------------------------------------------------------- */
/* Stream                                                                   */
/* ----------------------------------------------------------------------- */

export function StreamView({
  greetingTitle,
  dateLine,
  saving,
  onSave,
  thoughts,
  drawers,
  handlers,
  hasMore,
  loadingMore,
  onLoadMore,
  drawerFilter,
  onClearFilter,
  searchQuery,
  searchResults,
  searching,
}: {
  greetingTitle: string;
  dateLine: string;
  saving: boolean;
  onSave: (content: string) => Promise<boolean>;
  thoughts: ThoughtDTO[];
  drawers: DrawerDTO[];
  handlers: CardHandlers;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  drawerFilter: DrawerDTO | null;
  onClearFilter: () => void;
  searchQuery: string;
  searchResults: ThoughtDTO[] | null;
  searching: boolean;
}) {
  const inSearch = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      {!inSearch && (
        <div className="pt-2">
          <h1 className="font-heading text-[30px] font-semibold leading-tight tracking-tight text-ink sm:text-[34px]">
            {greetingTitle}
          </h1>
          <p className="mt-1 text-[13px] text-muted">{dateLine}</p>
        </div>
      )}

      {!inSearch && <Composer saving={saving} onSave={onSave} />}

      {drawerFilter && !inSearch && (
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          Showing
          <DrawerBadge drawer={drawerFilter} />
          <button
            type="button"
            onClick={onClearFilter}
            className="font-semibold text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
          >
            clear filter
          </button>
        </div>
      )}

      {inSearch ? (
        <div className="flex flex-col gap-2.5">
          <p className="flex items-center gap-2 text-[12.5px] text-muted">
            {searching && <LoaderCircle size={12} className="animate-spin" />}
            {searchResults
              ? `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} for "${searchQuery.trim()}"`
              : "Searching..."}
          </p>
          {searchResults && searchResults.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Nothing matches"
              body="Try a different keyword or a drawer name."
            />
          ) : (
            searchResults && (
              <List
                items={searchResults}
                context="stream"
                drawers={drawers}
                handlers={handlers}
              />
            )
          )}
        </div>
      ) : thoughts.length === 0 ? (
        <EmptyState
          icon={Feather}
          title={drawerFilter ? "This drawer is empty" : "A blank page is a good start"}
          body={
            drawerFilter
              ? "Drop a thought above and it may land here — or re-file one by editing its card."
              : "Write your first brain dump above. ThoughtPad files it for you, automatically."
          }
        />
      ) : (
        <>
          <List items={thoughts} context="stream" drawers={drawers} handlers={handlers} />
          <LoadMore visible={hasMore && !drawerFilter} loading={loadingMore} onClick={onLoadMore} />
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Archive                                                                  */
/* ----------------------------------------------------------------------- */

export function ArchiveView({
  thoughts,
  drawers,
  handlers,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  thoughts: ThoughtDTO[];
  drawers: DrawerDTO[];
  handlers: CardHandlers;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <ViewHeading
        title="Archive"
        blurb="Checked-off and filed-away thoughts rest here."
      />
      {thoughts.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Nothing finished yet"
          body="Check off a task or archive a note and it will quietly land here."
        />
      ) : (
        <>
          <List items={thoughts} context="archive" drawers={drawers} handlers={handlers} />
          <LoadMore visible={hasMore} loading={loadingMore} onClick={onLoadMore} />
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Recently deleted                                                         */
/* ----------------------------------------------------------------------- */

export function TrashView({
  thoughts,
  drawers,
  handlers,
  hasMore,
  loadingMore,
  onLoadMore,
  onEmptyTrash,
  emptying,
}: {
  thoughts: ThoughtDTO[];
  drawers: DrawerDTO[];
  handlers: CardHandlers;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onEmptyTrash: () => void;
  emptying: boolean;
}) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <ViewHeading
        title="Recently Deleted"
        blurb="Nothing is wiped until you say so. Restore or erase for good."
        action={
          thoughts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm) onEmptyTrash();
                else setConfirm(true);
              }}
              onMouseLeave={() => setConfirm(false)}
              disabled={emptying}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-all ${
                confirm
                  ? "bg-[#a04a32] text-paper"
                  : "border border-line bg-card text-ink-soft hover:border-[#a04a32]/40"
              }`}
            >
              {emptying ? (
                <LoaderCircle size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              {confirm ? "Really empty?" : "Empty trash"}
            </button>
          )
        }
      />
      {thoughts.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          body="Deleted thoughts wait here in case you change your mind."
        />
      ) : (
        <>
          <List items={thoughts} context="trash" drawers={drawers} handlers={handlers} />
          <LoadMore visible={hasMore} loading={loadingMore} onClick={onLoadMore} />
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */

export function ViewHeading({
  title,
  blurb,
  action,
}: {
  title: string;
  blurb: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 pt-2">
      <div>
        <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-tight text-ink sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-1 text-[13px] text-muted">{blurb}</p>
      </div>
      {action}
    </div>
  );
}
