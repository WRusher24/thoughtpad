"use server";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { drawers, thoughts } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { tokenize } from "@/lib/classifier";
import { toDrawerDTO } from "@/lib/data";
import { DRAWER_ICONS, PALETTE_KEYS } from "@/lib/palette";
import type { DrawerDTO } from "@/lib/types";

export interface DrawerActionResult {
  drawer?: DrawerDTO;
  error?: string;
}

const MAX_DRAWERS = 24;

export async function createDrawer(
  name: string,
  color: string,
  icon: string,
): Promise<DrawerActionResult> {
  const user = await requireUser();
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 32) {
    return { error: "Drawer names must be 1–32 characters." };
  }
  if (!PALETTE_KEYS.includes(color as never)) color = "sand";
  if (!DRAWER_ICONS.includes(icon as never)) icon = "shapes";

  const existing = await db
    .select()
    .from(drawers)
    .where(eq(drawers.userId, user.id));
  if (existing.length >= MAX_DRAWERS) {
    return { error: "You have plenty of drawers already." };
  }
  if (existing.some((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
    return { error: "A drawer with that name already exists." };
  }

  // Seed the classifier with tokens of the drawer's name so related
  // captures sort correctly from day one.
  const keywords = tokenize(trimmed);

  const [created] = await db
    .insert(drawers)
    .values({ userId: user.id, name: trimmed, color, icon, keywords })
    .returning();
  return { drawer: toDrawerDTO(created, 0) };
}

export async function updateDrawer(
  id: string,
  name: string,
  color: string,
  icon: string,
): Promise<DrawerActionResult> {
  const user = await requireUser();
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 32) {
    return { error: "Drawer names must be 1–32 characters." };
  }
  if (!PALETTE_KEYS.includes(color as never)) color = "sand";
  if (!DRAWER_ICONS.includes(icon as never)) icon = "shapes";

  const [updated] = await db
    .update(drawers)
    .set({ name: trimmed, color, icon, keywords: tokenize(trimmed) })
    .where(and(eq(drawers.id, id), eq(drawers.userId, user.id)))
    .returning();
  if (!updated) return { error: "Drawer not found." };
  return { drawer: toDrawerDTO(updated, 0) };
}

export interface DeleteDrawerResult {
  ok: boolean;
  error?: string;
  /** Thoughts from the removed drawer are re-filed here. */
  inboxDrawer?: DrawerDTO;
  affectedIds?: string[];
}

export async function deleteDrawer(id: string): Promise<DeleteDrawerResult> {
  const user = await requireUser();

  const rows = await db
    .select()
    .from(drawers)
    .where(and(eq(drawers.id, id), eq(drawers.userId, user.id)))
    .limit(1);
  const drawer = rows[0];
  if (!drawer) return { ok: false, error: "Drawer not found." };
  if (drawer.isSystem) return { ok: false, error: "The Inbox can't be removed." };

  const inbox = await db
    .select()
    .from(drawers)
    .where(
      and(
        eq(drawers.userId, user.id),
        eq(drawers.isSystem, true),
      ),
    )
    .limit(1);
  const fallback = inbox[0];
  if (!fallback) return { ok: false, error: "No Inbox drawer found." };

  const affected = await db
    .update(thoughts)
    .set({ drawerId: fallback.id, updatedAt: new Date() })
    .where(and(eq(thoughts.userId, user.id), eq(thoughts.drawerId, id)))
    .returning({ id: thoughts.id });

  await db
    .delete(drawers)
    .where(and(eq(drawers.id, id), eq(drawers.userId, user.id)));

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(thoughts)
    .where(
      and(
        eq(thoughts.userId, user.id),
        eq(thoughts.drawerId, fallback.id),
        sql`${thoughts.deletedAt} is null`,
        sql`${thoughts.completedAt} is null`,
      ),
    );

  return {
    ok: true,
    inboxDrawer: toDrawerDTO(fallback, countRow?.n ?? 0),
    affectedIds: affected.map((a) => a.id),
  };
}
