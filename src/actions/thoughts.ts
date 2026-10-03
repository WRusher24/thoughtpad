"use server";

import { and, desc, eq, ilike, isNotNull, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { drawers, thoughts } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { classifyThought, detectTask } from "@/lib/classifier";
import { toThoughtDTO } from "@/lib/data";
import { PAGE_SIZE, type ThoughtDTO } from "@/lib/types";

export type ThoughtView = "stream" | "archive" | "trash";

export interface ThoughtActionResult {
  thought?: ThoughtDTO;
  error?: string;
}

/** Load and verify a thought belongs to the current user. */
async function ownThought(userId: string, id: string) {
  const rows = await db
    .select()
    .from(thoughts)
    .where(and(eq(thoughts.id, id), eq(thoughts.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

async function drawerMap(userId: string) {
  const rows = await db.select().from(drawers).where(eq(drawers.userId, userId));
  return new Map(rows.map((d) => [d.id, d]));
}

/* ------------------------------------------------------------------------ */
/* Create — instant capture with smart drawer assignment                     */
/* ------------------------------------------------------------------------ */

export async function createThought(content: string): Promise<ThoughtActionResult> {
  const user = await requireUser();
  const trimmed = content.trim();
  if (!trimmed) return { error: "Write something first." };
  if (trimmed.length > 5000) return { error: "That thought is a bit too long." };

  const userDrawers = await db
    .select()
    .from(drawers)
    .where(eq(drawers.userId, user.id));

  // Train the sorter on the last 200 classified captures for adaptive Bayes.
  const history = await db
    .select({ drawerId: thoughts.drawerId, content: thoughts.content })
    .from(thoughts)
    .where(and(eq(thoughts.userId, user.id), isNotNull(thoughts.drawerId)))
    .orderBy(desc(thoughts.createdAt))
    .limit(200);

  const result = classifyThought(
    trimmed,
    userDrawers,
    history
      .filter((h) => h.drawerId)
      .map((h) => ({ drawerId: h.drawerId as string, content: h.content })),
  );

  const [created] = await db
    .insert(thoughts)
    .values({
      userId: user.id,
      drawerId: result.drawerId,
      content: trimmed,
      isTask: result.isTask,
    })
    .returning();

  const byId = new Map(userDrawers.map((d) => [d.id, d]));
  return {
    thought: toThoughtDTO(
      created,
      (created.drawerId && byId.get(created.drawerId)) || null,
    ),
  };
}

/* ------------------------------------------------------------------------ */
/* Edit — content re-sorts on save unless a drawer is chosen explicitly      */
/* ------------------------------------------------------------------------ */

export async function updateThought(
  id: string,
  content: string,
  explicitDrawerId?: string | null,
): Promise<ThoughtActionResult> {
  const user = await requireUser();
  const existing = await ownThought(user.id, id);
  if (!existing) return { error: "Thought not found." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "A thought can't be empty." };
  if (trimmed.length > 5000) return { error: "That thought is a bit too long." };

  let drawerId = existing.drawerId;
  if (explicitDrawerId !== undefined) {
    // Explicit manual assignment (or explicit clear with null).
    if (explicitDrawerId !== null) {
      const rows = await db
        .select({ id: drawers.id })
        .from(drawers)
        .where(and(eq(drawers.id, explicitDrawerId), eq(drawers.userId, user.id)))
        .limit(1);
      if (rows.length === 0) return { error: "Drawer not found." };
    }
    drawerId = explicitDrawerId;
  } else if (trimmed !== existing.content) {
    // Content changed without a manual pick → re-run the sorter.
    const userDrawers = await db
      .select()
      .from(drawers)
      .where(eq(drawers.userId, user.id));
    const history = await db
      .select({ drawerId: thoughts.drawerId, content: thoughts.content })
      .from(thoughts)
      .where(and(eq(thoughts.userId, user.id), isNotNull(thoughts.drawerId)))
      .orderBy(desc(thoughts.createdAt))
      .limit(200);
    const result = classifyThought(
      trimmed,
      userDrawers,
      history
        .filter((h) => h.drawerId)
        .map((h) => ({ drawerId: h.drawerId as string, content: h.content })),
    );
    drawerId = result.drawerId;
  }

  const [updated] = await db
    .update(thoughts)
    .set({
      content: trimmed,
      drawerId,
      isTask: detectTask(trimmed),
      updatedAt: new Date(),
    })
    .where(eq(thoughts.id, id))
    .returning();

  const byId = await drawerMap(user.id);
  return {
    thought: toThoughtDTO(
      updated,
      (updated.drawerId && byId.get(updated.drawerId)) || null,
    ),
  };
}

/* ------------------------------------------------------------------------ */
/* State transitions — stream ⇄ archive ⇄ trash                              */
/* ------------------------------------------------------------------------ */

async function transition(
  id: string,
  patch: Partial<typeof thoughts.$inferInsert>,
): Promise<ThoughtActionResult> {
  const user = await requireUser();
  const [updated] = await db
    .update(thoughts)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(thoughts.id, id), eq(thoughts.userId, user.id)))
    .returning();
  if (!updated) return { error: "Thought not found." };
  const byId = await drawerMap(user.id);
  return {
    thought: toThoughtDTO(
      updated,
      (updated.drawerId && byId.get(updated.drawerId)) || null,
    ),
  };
}

export async function completeThought(id: string) {
  return transition(id, { completedAt: new Date() });
}

export async function uncompleteThought(id: string) {
  return transition(id, { completedAt: null });
}

export async function trashThought(id: string) {
  return transition(id, { deletedAt: new Date() });
}

export async function restoreThought(id: string) {
  return transition(id, { deletedAt: null, completedAt: null });
}

/** Permanently wipe everything currently in Recently Deleted. */
export async function emptyTrash(): Promise<{ ok: boolean; removed: number }> {
  const user = await requireUser();
  const deleted = await db
    .delete(thoughts)
    .where(and(eq(thoughts.userId, user.id), isNotNull(thoughts.deletedAt)))
    .returning({ id: thoughts.id });
  return { ok: true, removed: deleted.length };
}

export async function permanentlyDeleteThought(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const deleted = await db
    .delete(thoughts)
    .where(and(eq(thoughts.id, id), eq(thoughts.userId, user.id)))
    .returning({ id: thoughts.id });
  return deleted.length > 0
    ? { ok: true }
    : { ok: false, error: "Thought not found." };
}

/* ------------------------------------------------------------------------ */
/* Reads — pagination, drawer filtering, search                              */
/* ------------------------------------------------------------------------ */

function viewClause(view: ThoughtView) {
  switch (view) {
    case "stream":
      return and(isNull(thoughts.deletedAt), isNull(thoughts.completedAt));
    case "archive":
      return and(isNull(thoughts.deletedAt), isNotNull(thoughts.completedAt));
    case "trash":
      return isNotNull(thoughts.deletedAt);
  }
}

export async function getMoreThoughts(
  view: ThoughtView,
  offset: number,
): Promise<ThoughtDTO[]> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(thoughts)
    .where(and(eq(thoughts.userId, user.id), viewClause(view)))
    .orderBy(
      view === "stream"
        ? desc(thoughts.createdAt)
        : desc(thoughts.updatedAt),
    )
    .offset(Math.max(0, offset))
    .limit(PAGE_SIZE);

  const byId = await drawerMap(user.id);
  return rows.map((t) =>
    toThoughtDTO(t, (t.drawerId && byId.get(t.drawerId)) || null),
  );
}

/** All stream thoughts inside one drawer (used when filtering the feed). */
export async function getThoughtsByDrawer(
  drawerId: string,
): Promise<ThoughtDTO[]> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(thoughts)
    .where(
      and(
        eq(thoughts.userId, user.id),
        eq(thoughts.drawerId, drawerId),
        isNull(thoughts.deletedAt),
        isNull(thoughts.completedAt),
      ),
    )
    .orderBy(desc(thoughts.createdAt))
    .limit(500);
  const byId = await drawerMap(user.id);
  return rows.map((t) =>
    toThoughtDTO(t, (t.drawerId && byId.get(t.drawerId)) || null),
  );
}

/** Real-time search across the stream (content or drawer name). */
export async function searchThoughts(query: string): Promise<ThoughtDTO[]> {
  const user = await requireUser();
  const q = query.trim();
  if (q.length < 1) return [];

  const byId = await drawerMap(user.id);
  const nameMatches = [...byId.values()]
    .filter((d) => d.name.toLowerCase().includes(q.toLowerCase()))
    .map((d) => d.id);

  const rows = await db
    .select()
    .from(thoughts)
    .where(
      and(
        eq(thoughts.userId, user.id),
        isNull(thoughts.deletedAt),
        or(
          ilike(thoughts.content, `%${q}%`),
          nameMatches.length > 0
            ? or(...nameMatches.map((id) => eq(thoughts.drawerId, id)))
            : undefined,
        ),
      ),
    )
    .orderBy(desc(thoughts.createdAt))
    .limit(100);

  return rows.map((t) =>
    toThoughtDTO(t, (t.drawerId && byId.get(t.drawerId)) || null),
  );
}
