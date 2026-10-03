import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { drawers, thoughts } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * GET /api/export?format=json|csv
 * Downloads every brain dump, drawer and setting owned by the session user.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = new URL(request.url).searchParams.get("format") ?? "json";
  const stamp = new Date().toISOString().slice(0, 10);

  const [drawerRows, thoughtRows] = await Promise.all([
    db
      .select()
      .from(drawers)
      .where(eq(drawers.userId, user.id))
      .orderBy(drawers.createdAt),
    db
      .select()
      .from(thoughts)
      .where(eq(thoughts.userId, user.id))
      .orderBy(desc(thoughts.createdAt)),
  ]);

  const drawerById = new Map(drawerRows.map((d) => [d.id, d]));

  if (format === "csv") {
    const header = [
      "id",
      "content",
      "drawer",
      "is_task",
      "status",
      "created_at",
      "updated_at",
      "completed_at",
      "deleted_at",
    ];
    const lines = thoughtRows.map((t) => {
      const status = t.deletedAt
        ? "trash"
        : t.completedAt
          ? "archived"
          : "active";
      return [
        csvEscape(t.id),
        csvEscape(t.content),
        csvEscape((t.drawerId && drawerById.get(t.drawerId)?.name) || ""),
        t.isTask ? "yes" : "no",
        status,
        t.createdAt.toISOString(),
        t.updatedAt.toISOString(),
        t.completedAt?.toISOString() ?? "",
        t.deletedAt?.toISOString() ?? "",
      ].join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="thoughtpad-export-${stamp}.csv"`,
      },
    });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    app: "ThoughtPad",
    account: {
      username: user.username,
      displayName: user.displayName,
      memberSince: user.createdAt.toISOString(),
    },
    drawers: drawerRows.map((d) => ({
      id: d.id,
      name: d.name,
      color: d.color,
      icon: d.icon,
      keywords: d.keywords,
      isSystem: d.isSystem,
      createdAt: d.createdAt.toISOString(),
    })),
    thoughts: thoughtRows.map((t) => ({
      id: t.id,
      content: t.content,
      drawer: (t.drawerId && drawerById.get(t.drawerId)?.name) || null,
      drawerId: t.drawerId,
      isTask: t.isTask,
      status: t.deletedAt ? "trash" : t.completedAt ? "archived" : "active",
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      completedAt: t.completedAt?.toISOString() ?? null,
      deletedAt: t.deletedAt?.toISOString() ?? null,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="thoughtpad-export-${stamp}.json"`,
    },
  });
}
