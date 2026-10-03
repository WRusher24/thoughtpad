import type { Drawer } from "@/db/schema";

/**
 * ThoughtPad smart-sorting engine ("Brain Drawers" auto-tagging).
 *
 * The classifier is deliberately local and deterministic — no external API
 * calls, works offline and in any language:
 *
 *  1. Tokenizer — Unicode-aware, so Arabic / Cyrillic / CJK … all tokenize.
 *  2. Keyword priors — each drawer carries curated seed keywords plus the
 *     tokens of its own name; strong evidence for assignment.
 *  3. Adaptive Naive Bayes — the model is trained on the user's own capture
 *     history (previous thought → drawer assignments), so sorting steadily
 *     adapts to personal vocabulary the more the app is used.
 *  4. Task detection — a multilingual cue list (EN + common phrases) marks
 *     actionable thoughts so they can be checked off into the Archive.
 */

export interface ClassificationResult {
  drawerId: string | null;
  isTask: boolean;
  /** 0..1 — how confident the sorter is in its pick. */
  confidence: number;
}

export interface HistoryEntry {
  drawerId: string;
  content: string;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (t) => t.length > 1 || /\p{N}/u.test(t),
  );
}

/* ------------------------------------------------------------------------- */
/* Task-cue detection                                                        */
/* ------------------------------------------------------------------------- */

const TASK_CUES = [
  // English intent markers
  "need to",
  "have to",
  "remember to",
  "don't forget",
  "do not forget",
  "remind me",
  "to-do",
  "todo",
  "must ",
  "should ",
  "gotta ",
  "deadline",
  "due ",
  "appointment",
  "reschedule",
  // Imperative openers / verbs
  "buy ",
  "call ",
  "email ",
  "text ",
  "pick up",
  "drop off",
  "schedule ",
  "book ",
  "pay ",
  "renew ",
  "submit ",
  "finish ",
  "fix ",
  "send ",
  "order ",
  "return ",
  "cancel ",
  "sign up",
  // checkbox syntax
  "[ ]",
  "- []",
  // Arabic cues (users may capture in any language)
  "لازم",
  "لا تنس",
  "تذكر",
  "موعد",
  // A few Romance-language cues for good measure
  "recordar",
  "no olvidar",
  "ne pas oublier",
];

export function detectTask(content: string): boolean {
  const t = ` ${content.toLowerCase()} `;
  return TASK_CUES.some((cue) => t.includes(cue));
}

/* ------------------------------------------------------------------------- */
/* Classifier                                                                */
/* ------------------------------------------------------------------------- */

const PRIOR_KEYWORD_WEIGHT = 3.5;
const PRIOR_NAME_WEIGHT = 6;
const BAYES_WEIGHT = 1.6;
const ASSIGN_THRESHOLD = 3.2;

export function classifyThought(
  content: string,
  drawers: Drawer[],
  history: HistoryEntry[],
): ClassificationResult {
  const tokens = tokenize(content);
  const tokenSet = new Set(tokens);
  const haystack = ` ${content.toLowerCase()} `;
  const isTask = detectTask(content);

  const inbox = drawers.find(
    (d) => d.isSystem && d.name.toLowerCase() === "inbox",
  );
  const fallbackId = inbox?.id ?? drawers[0]?.id ?? null;

  if (drawers.length === 0) {
    return { drawerId: null, isTask, confidence: 0 };
  }

  // --- Train tiny per-drawer Naive Bayes models from capture history -------
  const vocab = new Set<string>();
  const tokenCounts = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();
  for (const h of history) {
    const toks = tokenize(h.content);
    const bag = tokenCounts.get(h.drawerId) ?? new Map<string, number>();
    for (const tok of toks) {
      vocab.add(tok);
      bag.set(tok, (bag.get(tok) ?? 0) + 1);
      totals.set(h.drawerId, (totals.get(h.drawerId) ?? 0) + 1);
    }
    tokenCounts.set(h.drawerId, bag);
  }
  const vocabSize = Math.max(vocab.size, 1);

  let bestId: string | null = null;
  let bestScore = -Infinity;
  let secondBest = -Infinity;

  for (const drawer of drawers) {
    let score = 0;

    // Keyword priors — full-phrase keywords match against the raw text,
    // single tokens match against the token set.
    for (const kw of drawer.keywords) {
      const needle = kw.toLowerCase();
      if (needle.includes(" ")) {
        if (haystack.includes(needle)) score += PRIOR_KEYWORD_WEIGHT;
      } else if (tokenSet.has(needle)) {
        score += PRIOR_KEYWORD_WEIGHT;
      }
    }

    // The drawer's own name tokens are the strongest explicit evidence.
    for (const nameToken of tokenize(drawer.name)) {
      if (tokenSet.has(nameToken)) score += PRIOR_NAME_WEIGHT;
    }

    // Adaptive Bayes from the user's own history.
    const bag = tokenCounts.get(drawer.id);
    const total = totals.get(drawer.id) ?? 0;
    if (bag && total > 0) {
      let bayes = 0;
      for (const tok of tokens) {
        const c = bag.get(tok) ?? 0;
        bayes += Math.log((c + 1) / (total + vocabSize));
      }
      score += (bayes / Math.max(tokens.length, 1)) * BAYES_WEIGHT;
    }

    // Tiny prior nudge so frequent drawers win ties.
    score += Math.log(1 + total) * 0.15;

    if (score > bestScore) {
      secondBest = bestScore;
      bestScore = score;
      bestId = drawer.id;
    } else if (score > secondBest) {
      secondBest = score;
    }
  }

  if (bestScore < ASSIGN_THRESHOLD || bestId === inbox?.id) {
    return { drawerId: fallbackId, isTask, confidence: 0.2 };
  }

  const margin = bestScore - Math.max(secondBest, 0);
  const confidence = Math.min(0.97, 0.55 + margin * 0.08 + bestScore * 0.01);

  return { drawerId: bestId, isTask, confidence };
}

/* ------------------------------------------------------------------------- */
/* Default drawers seeded for every new account                               */
/* ------------------------------------------------------------------------- */

export const DEFAULT_DRAWERS: {
  name: string;
  color: string;
  icon: string;
  isSystem: boolean;
  keywords: string[];
}[] = [
  {
    name: "Inbox",
    color: "slate",
    icon: "inbox",
    isSystem: true,
    keywords: [],
  },
  {
    name: "Ideas",
    color: "amber",
    icon: "lightbulb",
    isSystem: false,
    keywords: [
      "idea",
      "ideas",
      "concept",
      "startup",
      "app",
      "build",
      "create",
      "design",
      "launch",
      "brainstorm",
      "vision",
      "product",
      "feature",
      "side project",
      "business",
      "what if",
      "maybe",
      "imagine",
      "invention",
      "فكرة",
    ],
  },
  {
    name: "Work",
    color: "sky",
    icon: "briefcase",
    isSystem: false,
    keywords: [
      "work",
      "meeting",
      "deadline",
      "email",
      "report",
      "manager",
      "project",
      "client",
      "presentation",
      "standup",
      "review",
      "deploy",
      "boss",
      "colleague",
      "office",
      "sprint",
      "roadmap",
      "hire",
      "interview",
      "slides",
      "invoice",
      "contract",
      "quarterly",
    ],
  },
  {
    name: "Personal",
    color: "rose",
    icon: "heart",
    isSystem: false,
    keywords: [
      "family",
      "friend",
      "friends",
      "mom",
      "dad",
      "birthday",
      "doctor",
      "gym",
      "workout",
      "health",
      "book",
      "movie",
      "trip",
      "vacation",
      "journal",
      "feeling",
      "grateful",
      "dinner",
      "weekend",
      "kids",
      "dream",
      "mood",
    ],
  },
  {
    name: "Errands",
    color: "sage",
    icon: "shopping-basket",
    isSystem: false,
    keywords: [
      "buy",
      "groceries",
      "grocery",
      "milk",
      "eggs",
      "pick up",
      "pharmacy",
      "post office",
      "laundry",
      "dry cleaning",
      "pay bill",
      "bill",
      "renew",
      "return",
      "order",
      "store",
      "supermarket",
      "batteries",
      "shampoo",
      "repair",
      "carwash",
    ],
  },
];
