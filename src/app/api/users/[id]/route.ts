import { eq } from "drizzle-orm";
import { db } from "@/db";
import { licenses, users } from "@/db/schema";
import {
  currentUser,
  forbidden,
  hashPassword,
  json,
  unauthorized,
} from "@/lib/auth";
import { logAction } from "@/lib/log";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/users/:id — edit, block, unblock, reset password, set key limit. */
export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  const me = await currentUser();
  if (!me) return unauthorized();
  const isSelf = me.id === (await params).id;
  // Owner may edit anyone; a reseller may only edit their own name/password.
  if (me.role !== "owner" && !isSelf) return forbidden();

  const { id } = await params;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const target = rows[0];
  if (!target) return json({ error: "Account not found." }, 404);

  let body: {
    name?: string;
    active?: boolean;
    maxKeys?: number | null;
    password?: string;
    revokeKeys?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  // Block/unblock, key-cap changes and mass-revoke stay Master Owner only.
  if (!isSelf && me.role !== "owner") return forbidden();

  const patch: Partial<typeof users.$inferInsert> = {};
  if (typeof body.name === "string") patch.name = body.name.trim().slice(0, 60);
  if (typeof body.active === "boolean") patch.active = body.active;
  if (body.maxKeys === null) patch.maxKeys = null;
  else if (typeof body.maxKeys === "number" && body.maxKeys > 0)
    patch.maxKeys = Math.floor(body.maxKeys);
  if (typeof body.password === "string" && body.password.length >= 6)
    patch.passwordHash = hashPassword(body.password);

  if (Object.keys(patch).length > 0) {
    await db.update(users).set(patch).where(eq(users.id, id));
  }

  // Supreme control: the owner can instantly revoke every key this account issued.
  if (body.revokeKeys === true && me.role === "owner") {
    await db
      .update(licenses)
      .set({ status: "revoked" })
      .where(eq(licenses.issuedBy, id));
  }

  const verb =
    !isSelf && body.active === false
      ? "user_blocked"
      : !isSelf && body.revokeKeys
        ? "user_blocked"
        : "user_edited";
  await logAction(
    me.username,
    verb,
    `${target.username}${body.revokeKeys ? " + all their keys revoked" : ""}`,
  );
  return json({ ok: true });
}

/** DELETE /api/users/:id — remove a reseller account (keys stay in the ledger). */
export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  const me = await currentUser();
  if (!me) return unauthorized();
  if (me.role !== "owner") return forbidden();
  const { id } = await params;
  if (id === me.id) {
    return json({ error: "You cannot delete your own account." }, 400);
  }
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!rows[0]) return json({ error: "Account not found." }, 404);
  await db.delete(users).where(eq(users.id, id));
  await logAction(me.username, "user_deleted", rows[0].username);
  return json({ ok: true });
}
