"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { seedDefaultsForUser } from "@/lib/seed-defaults";

export interface AuthFormState {
  error: string | null;
}

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

function invalid(message: string): AuthFormState {
  return { error: message };
}

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!USERNAME_RE.test(username)) {
    return invalid(
      "Username must be 3–24 characters: letters, numbers, dots, dashes, underscores.",
    );
  }
  if (password.length < 8) {
    return invalid("Password must be at least 8 characters long.");
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing.length > 0) {
    return invalid("That username is already taken. Try another one.");
  }

  const userId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({
        username,
        displayName: displayName || null,
        passwordHash: hashPassword(password),
      })
      .returning({ id: users.id });
    return created.id;
  });

  await seedDefaultsForUser(userId);
  await createSession(userId);
  redirect("/");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return invalid("Enter your username and password.");
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return invalid("Incorrect username or password.");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
