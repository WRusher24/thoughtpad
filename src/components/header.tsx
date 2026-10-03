"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";

interface HeaderProps {
  onOpenSidebar: () => void;
  searchOpen: boolean;
  onSearchOpen: (open: boolean) => void;
  query: string;
  onQuery: (q: string) => void;
}

export function Header({
  onOpenSidebar,
  searchOpen,
  onSearchOpen,
  query,
  onQuery,
}: HeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-3">
        <AnimatePresence mode="wait" initial={false}>
          {searchOpen ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="flex w-full items-center gap-2"
            >
              <Search size={17} className="ml-2 shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onQuery("");
                    onSearchOpen(false);
                  }
                }}
                placeholder="Search thoughts or drawers..."
                className="h-10 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/70"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => {
                  onQuery("");
                  onSearchOpen(false);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream hover:text-ink"
              >
                <X size={18} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="bar"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.16 }}
              className="flex w-full items-center"
            >
              <button
                type="button"
                aria-label="Open menu"
                onClick={onOpenSidebar}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream active:scale-95"
              >
                <Menu size={20} strokeWidth={1.9} />
              </button>

              <span className="font-heading pointer-events-none absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold italic tracking-tight text-ink">
                ThoughtPad
              </span>

              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => onSearchOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream active:scale-95"
                >
                  <Search size={19} strokeWidth={1.9} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
