/**
 * Shared design tokens & content constants for ThoughtPad.
 * The palette is tuned for the warm off-white / parchment aesthetic:
 * muted, ink-on-paper tints instead of saturated UI colors.
 */

export type PaletteKey =
  | "sand"
  | "amber"
  | "sage"
  | "clay"
  | "sky"
  | "lilac"
  | "rose"
  | "mint"
  | "slate";

export const DRAWER_PALETTE: Record<
  PaletteKey,
  { bg: string; text: string; dot: string; label: string }
> = {
  sand: { bg: "#EFE9DC", text: "#7A6741", dot: "#C9B68C", label: "Sand" },
  amber: { bg: "#F5E9D7", text: "#8A5A1E", dot: "#D9A45B", label: "Amber" },
  sage: { bg: "#E4EAD9", text: "#4C6B35", dot: "#8FA96F", label: "Sage" },
  clay: { bg: "#F3DDD3", text: "#8F4E2E", dot: "#CE8A66", label: "Clay" },
  sky: { bg: "#DEE8EE", text: "#3A6076", dot: "#7FA4BC", label: "Sky" },
  lilac: { bg: "#E8E2F0", text: "#615282", dot: "#A394C7", label: "Lilac" },
  rose: { bg: "#F2DEE0", text: "#8E4B55", dot: "#C98B95", label: "Rose" },
  mint: { bg: "#DDEEE6", text: "#2F6B52", dot: "#79B59B", label: "Mint" },
  slate: { bg: "#E5E4DF", text: "#55534B", dot: "#9A988C", label: "Slate" },
};

export const PALETTE_KEYS = Object.keys(DRAWER_PALETTE) as PaletteKey[];

/** Lucide icon keys offered in the drawer editor. */
export const DRAWER_ICONS = [
  "shapes",
  "inbox",
  "lightbulb",
  "briefcase",
  "shopping-basket",
  "heart",
  "star",
  "book-open",
  "music",
  "home",
  "dumbbell",
  "plane",
  "wallet",
  "coffee",
  "sparkles",
  "pen-line",
] as const;

export type DrawerIconKey = (typeof DRAWER_ICONS)[number];

/** Rotating, friendly prompts for the instant-capture textarea. */
export const COMPOSER_PROMPTS = [
  "What's on your mind right now?",
  "Dump it before you forget...",
  "One quick thought — go.",
  "Brain too loud? Write it down.",
  "Capture it now. Sort it never.",
  "That idea deserves a home...",
  "Type it. Tag it. Done.",
  "What are you overthinking today?",
  "A penny for your thoughts...",
  "Future you says thanks.",
];

export type FontStyle = "classic" | "playful" | "typewriter";

export const FONT_STYLES: { key: FontStyle; label: string; blurb: string }[] = [
  {
    key: "classic",
    label: "Classic Clean",
    blurb: "Crisp sans-serif everywhere. Calm and neutral.",
  },
  {
    key: "playful",
    label: "Playful Serif",
    blurb: "Fraunces headlines with a clean reading body.",
  },
  {
    key: "typewriter",
    label: "Typewriter Mono",
    blurb: "Courier Prime — like a letterpress notepad.",
  },
];
