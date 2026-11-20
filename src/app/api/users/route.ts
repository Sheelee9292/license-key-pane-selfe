import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { licenses, users } from "@/db/schema";
import { currentUser, forbidden, hashPassword, json, unauthorized } from "@/lib/auth";
import { logAction } from "@/lib/log";

/** GET /api/users — Master Owner only. Lists every panel account with key counts. */
export async function GET(): Promise<Response> {
  const me = await currentUser();
  if (!me) return unauthorized();
  if (me.role !== "owner") return forbidden();

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      active: users.active,
      maxKeys: users.maxKeys,
      createdAt: users.createdAt,
      issued: sql<number>`(select count(*)::int from licenses l where l.issued_by = ${users.id})`,
      activeKeys: sql<number>`(
        select count(*)::int from licenses l
        where l.issued_by = ${users.id}
          and l.status = 'active'
          and l.expires_at > now()
      )`,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return json({
    users: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

/** POST /api/users — create a reseller / sub-user account. */
export async function POST(req: Request): Promise<Response> {
  const me = await currentUser();
  if (!me) return unauthorized();
  if (me.role !== "owner") return forbidden();

  let body: {
    username?: string;
    password?: string;
    name?: string;
    maxKeys?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const username = (body.username || "").trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) {
    return json(
      { error: "Username: 3–24 chars, letters/numbers/._- only." },
      400,
    );
  }
  if ((body.password || "").length < 6) {
    return json({ error: "Password must be at least 6 characters." }, 400);
  }
  const clash = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (clash.length > 0) {
    return json({ error: "That username is already taken." }, 409);
  }

  const maxKeys =
    typeof body.maxKeys === "number" && body.maxKeys > 0
      ? Math.floor(body.maxKeys)
      : null;

  const inserted = await db
    .insert(users)
    .values({
      username,
      passwordHash: hashPassword(body.password as string),
      name: (body.name || "").trim().slice(0, 60) || username,
      role: "reseller",
      active: true,
      maxKeys,
    })
    .returning();

  await logAction(me.username, "user_created", `Reseller "${username}"`);
  return json(
    {
      ok: true,
      user: {
        id: inserted[0].id,
        username: inserted[0].username,
        name: inserted[0].name,
        role: inserted[0].role,
        active: inserted[0].active,
        maxKeys: inserted[0].maxKeys,
        createdAt: inserted[0].createdAt.toISOString(),
        issued: 0,
        activeKeys: 0,
      },
    },
    201,
  );
}
