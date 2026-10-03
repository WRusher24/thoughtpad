import "server-only";

import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { drawers, thoughts, userSettings, type Drawer } from "@/db/schema";
import type { DrawerDTO, InitialData, ThoughtDTO } from "@/lib/types";
import { PAGE_SIZE } from "@/lib/types";
import type { FontStyle } from "@/lib/palette";

export function toDrawerDTO(d: Drawer, thoughtCount = 0): DrawerDTO {
  return {
    id: d.id,
    name: d.name,
    color: d.color,
    icon: d.icon,
    isSystem: d.isSystem,
    createdAt: d.createdAt.toISOString(),
    thoughtCount,
  };
}

export function toThoughtDTO(
  t: typeof thoughts.$inferSelect,
  drawer: Drawer | null,
): ThoughtDTO {
  return {
    id: t.id,
    content: t.content,
    isTask: t.isTask,
    drawerId: t.drawerId,
    drawer: drawer
      ? { id: drawer.id, name: drawer.name, color: drawer.color, icon: drawer.icon }
      : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    deletedAt: t.deletedAt ? t.deletedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

async function countWhere(userId: string, clause: ReturnType<typeof and>) {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(thoughts)
    .where(and(eq(thoughts.userId, userId), clause));
  return rows[0]?.n ?? 0;
}

/** Everything the client shell needs for first paint — one round trip. */
export async function loadInitialData(user: {
  id: string;
  username: string;
  displayName: string | null;
  createdAt: Date;
}): Promise<InitialData> {
  const [drawerRows, settingsRows, streamCount, archiveCount, trashCount] =
    await Promise.all([
      db
        .select()
        .from(drawers)
        .where(eq(drawers.userId, user.id))
        .orderBy(drawers.createdAt),
      db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, user.id))
        .limit(1),
      countWhere(user.id, and(isNull(thoughts.deletedAt), isNull(thoughts.completedAt))),
      countWhere(user.id, and(isNull(thoughts.deletedAt), isNotNull(thoughts.completedAt))),
      countWhere(user.id, isNotNull(thoughts.deletedAt)),
    ]);

  const drawerById = new Map(drawerRows.map((d) => [d.id, d]));

  const recent = await db
    .select()
    .from(thoughts)
    .where(
      and(
        eq(thoughts.userId, user.id),
        isNull(thoughts.deletedAt),
        isNull(thoughts.completedAt),
      ),
    )
    .orderBy(desc(thoughts.createdAt))
    .limit(PAGE_SIZE);

  const perDrawerCounts = await db
    .select({ drawerId: thoughts.drawerId, n: sql<number>`count(*)::int` })
    .from(thoughts)
    .where(
      and(
        eq(thoughts.userId, user.id),
        isNull(thoughts.deletedAt),
        isNull(thoughts.completedAt),
      ),
    )
    .groupBy(thoughts.drawerId);

  const countByDrawer = new Map(
    perDrawerCounts.map((r) => [r.drawerId, r.n]),
  );

  const fontStyle = (settingsRows[0]?.fontStyle ?? "playful") as FontStyle;

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
    },
    fontStyle,
    drawers: drawerRows.map((d) => toDrawerDTO(d, countByDrawer.get(d.id) ?? 0)),
    thoughts: recent.map((t) =>
      toThoughtDTO(t, (t.drawerId && drawerById.get(t.drawerId)) || null),
    ),
    counts: { stream: streamCount, archive: archiveCount, trash: trashCount },
  };
}
