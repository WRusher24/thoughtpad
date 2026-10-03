"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import type { FontStyle } from "@/lib/palette";

const VALID: FontStyle[] = ["classic", "playful", "typewriter"];

export async function updateFontStyle(
  style: FontStyle,
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (!VALID.includes(style)) return { ok: false };
  await db
    .insert(userSettings)
    .values({ userId: user.id, fontStyle: style, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { fontStyle: style, updatedAt: new Date() },
    });
  return { ok: true };
}
