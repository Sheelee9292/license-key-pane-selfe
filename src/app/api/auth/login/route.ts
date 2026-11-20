import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  currentUser,
  hashPassword,
  json,
  verifyPassword,
} from "@/lib/auth";
import { logAction } from "@/lib/log";

/**
 * First boot: create the Master Owner account automatically.
 * Username: owner   Password: shakeel258
 * (change it right after first login from Panel → Users)
 */
async function ensureMasterExists(): Promise<void> {
  const count = await db.select({ id: users.id }).from(users).limit(1);
  if (count.length > 0) return;
  const username = process.env.MASTER_USERNAME || "owner";
  const password = process.env.MASTER_PASSWORD || "shakeel258";
  await db.insert(users).values({
    username,
    passwordHash: hashPassword(password),
    name: "Master Owner",
    role: "owner",
    active: true,
    maxKeys: null,
  });
  await logAction("system", "master_seeded", `Master owner "${username}" created`);
}

export async function POST(req: Request): Promise<Response> {
  await ensureMasterExists();
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";
  if (!username || !password) {
    return json({ error: "Enter your username and password." }, 400);
  }
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return json({ error: "Wrong username or password." }, 401);
  }
  if (!user.active) {
    return json(
      { error: "This account has been blocked by the Master Owner." },
      403,
    );
  }
  await createSession(user.id);
  await logAction(user.username, "login", "Signed in to the panel");
  return json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
  });
}

export async function GET(): Promise<Response> {
  const user = await currentUser();
  if (!user) return json({ user: null });
  return json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      maxKeys: user.maxKeys,
    },
  });
}
