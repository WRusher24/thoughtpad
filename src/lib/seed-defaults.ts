import "server-only";

import { db } from "@/db";
import { drawers, userSettings } from "@/db/schema";
import { DEFAULT_DRAWERS } from "@/lib/classifier";

/**
 * Provisions a fresh account: default "Brain Drawers" (including the
 * undeletable system Inbox) and a settings row. Called at registration and
 * reused by the database seed script.
 */
export async function seedDefaultsForUser(userId: string): Promise<void> {
  await db.insert(userSettings).values({ userId, fontStyle: "playful" });

  await db.insert(drawers).values(
    DEFAULT_DRAWERS.map((d) => ({
      userId,
      name: d.name,
      color: d.color,
      icon: d.icon,
      isSystem: d.isSystem,
      keywords: d.keywords,
    })),
  );
}
