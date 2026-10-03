/**
 * ThoughtPad — database seed script.
 *
 *   npm run seed
 *
 * Creates a fully-populated demo account so the app is instantly explorable:
 *
 *     username:  demo
 *     password:  thoughtpad123
 *
 * The script is idempotent — if the demo user already exists it exits
 * without touching any data.
 */

import { config } from "dotenv";
config();

import { randomBytes, scryptSync } from "crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { drawers, thoughts, users, userSettings } from "./schema";
import { DEFAULT_DRAWERS } from "../lib/classifier";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const db = drizzle(new Pool({ connectionString: url }));

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, "demo"))
    .limit(1);

  if (existing.length > 0) {
    console.log("Demo user already exists — nothing to do.");
    console.log("Log in with  demo / thoughtpad123");
    process.exit(0);
  }

  console.log("Seeding demo account...");

  const [demo] = await db
    .insert(users)
    .values({
      username: "demo",
      displayName: "Salem",
      passwordHash: hashPassword("thoughtpad123"),
    })
    .returning();

  await db.insert(userSettings).values({
    userId: demo.id,
    fontStyle: "playful",
  });

  const createdDrawers = await db
    .insert(drawers)
    .values([
      ...DEFAULT_DRAWERS.map((d) => ({
        userId: demo.id,
        name: d.name,
        color: d.color,
        icon: d.icon,
        isSystem: d.isSystem,
        keywords: d.keywords,
      })),
      {
        userId: demo.id,
        name: "Reading List",
        color: "lilac",
        icon: "book-open",
        isSystem: false,
        keywords: ["read", "book", "novel", "chapter", "author", "article"],
      },
      {
        userId: demo.id,
        name: "Startup Lab",
        color: "mint",
        icon: "sparkles",
        isSystem: false,
        keywords: ["startup", "saas", "mvp", "founder", "revenue", "waitlist"],
      },
    ])
    .returning();

  const byName = new Map(createdDrawers.map((d) => [d.name, d.id]));
  const drawer = (n: string) => byName.get(n) ?? null;

  const rows: (typeof thoughts.$inferInsert)[] = [
    {
      userId: demo.id,
      drawerId: drawer("Ideas"),
      content:
        "App idea: a focus timer that grows a tiny zen garden the longer you stay off your phone. Share gardens with friends.",
      isTask: false,
      createdAt: hoursAgo(1),
    },
    {
      userId: demo.id,
      drawerId: drawer("Errands"),
      content: "Buy oat milk, coffee beans, and that basil plant I keep forgetting.",
      isTask: true,
      createdAt: hoursAgo(3),
    },
    {
      userId: demo.id,
      drawerId: drawer("Work"),
      content: "Email Priya the updated projections before Thursday's board meeting.",
      isTask: true,
      createdAt: hoursAgo(5),
    },
    {
      userId: demo.id,
      drawerId: drawer("Personal"),
      content: "Call grandma this weekend — she keeps asking about the Lisbon photos.",
      isTask: true,
      createdAt: hoursAgo(8),
    },
    {
      userId: demo.id,
      drawerId: drawer("Startup Lab"),
      content:
        "Micro-SaaS for indie podcasts: auto-generated chapter markers + transcripts as a service. Charge per episode, not per month.",
      isTask: false,
      createdAt: hoursAgo(14),
    },
    {
      userId: demo.id,
      drawerId: drawer("Ideas"),
      content: "فكرة: نوادي قراءة صغيرة داخل المقاهي المحلية، كل أسبوع كتاب مختلف",
      isTask: false,
      createdAt: hoursAgo(20),
    },
    {
      userId: demo.id,
      drawerId: drawer("Inbox"),
      content: "The smell of rain on warm pavement has a name: petrichor.",
      isTask: false,
      createdAt: hoursAgo(26),
    },
    {
      userId: demo.id,
      drawerId: drawer("Reading List"),
      content:
        "Finish 'The Creative Act' by Rick Rubin — everyone keeps quoting chapter 8 at me.",
      isTask: true,
      createdAt: hoursAgo(30),
    },
    {
      userId: demo.id,
      drawerId: drawer("Work"),
      content:
        "Retro note: the deploy pipeline fails silently when the cache key collides. Write it up for the team wiki.",
      isTask: true,
      createdAt: hoursAgo(36),
    },
    {
      userId: demo.id,
      drawerId: drawer("Ideas"),
      content: "What if parking meters donated your spare minutes to the next driver?",
      isTask: false,
      createdAt: hoursAgo(44),
    },
    {
      userId: demo.id,
      drawerId: drawer("Work"),
      content: "Prep talking points for the 1:1 — onboarding doc feedback and the Q3 roadmap.",
      isTask: true,
      createdAt: hoursAgo(52),
    },
    {
      userId: demo.id,
      drawerId: drawer("Inbox"),
      content: "Airport pickup code is in the email titled 'Terminal 2 details'.",
      isTask: false,
      createdAt: hoursAgo(60),
    },
    // Archived (checked-off) ----------------------------------------------
    {
      userId: demo.id,
      drawerId: drawer("Errands"),
      content: "Renew the car insurance before it lapses on the 15th.",
      isTask: true,
      createdAt: hoursAgo(70),
      completedAt: hoursAgo(48),
    },
    {
      userId: demo.id,
      drawerId: drawer("Startup Lab"),
      content: "Waitlist landing page copy: 'Your second brain, on paper.'",
      isTask: false,
      createdAt: hoursAgo(90),
      completedAt: hoursAgo(70),
    },
    // Recently deleted ------------------------------------------------------
    {
      userId: demo.id,
      drawerId: drawer("Personal"),
      content: "Book dentist appointment for the chipped molar.",
      isTask: true,
      createdAt: hoursAgo(100),
      deletedAt: hoursAgo(12),
    },
  ];

  await db.insert(thoughts).values(rows);

  console.log("Seed complete.");
  console.log("  → Log in with  demo / thoughtpad123");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
