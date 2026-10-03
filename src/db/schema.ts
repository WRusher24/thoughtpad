import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * ThoughtPad — database schema
 * --------------------------------------------------------------------------
 * Every domain row carries a `userId` foreign key. All application queries
 * filter by the authenticated session's user id, which guarantees strict
 * per-user data isolation: no user can read or mutate another user's rows.
 */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  /** scrypt hash in the format `salt:hash` (hex encoded). */
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** SHA-256 hex of the opaque bearer token stored in the cookie. */
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const drawers = pgTable(
  "drawers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** One of the muted parchment palette keys defined in src/lib/palette.ts */
    color: text("color").notNull().default("sand"),
    /** Lucide icon key, e.g. "lightbulb", "briefcase". */
    icon: text("icon").notNull().default("shapes"),
    /**
     * Keyword priors used by the smart-sorting classifier. Matching tokens in
     * a thought nudge the classifier towards this drawer.
     */
    keywords: text("keywords")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** System drawers (e.g. "Inbox") cannot be deleted. */
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("drawers_user_idx").on(t.userId)],
);

export const thoughts = pgTable(
  "thoughts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    drawerId: uuid("drawer_id").references(() => drawers.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    /** Whether the capture reads like an actionable task. */
    isTask: boolean("is_task").notNull().default(false),
    /** Set when checked off — the thought lives in the Archive. */
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Soft-delete marker — the thought lives in Recently Deleted. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("thoughts_user_created_idx").on(t.userId, t.createdAt),
    index("thoughts_user_deleted_idx").on(t.userId, t.deletedAt),
    index("thoughts_user_completed_idx").on(t.userId, t.completedAt),
    index("thoughts_drawer_idx").on(t.drawerId),
  ],
);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** "classic" | "playful" | "typewriter" */
  fontStyle: text("font_style").notNull().default("playful"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Drawer = typeof drawers.$inferSelect;
export type Thought = typeof thoughts.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
