import { eq } from "drizzle-orm";
import { db } from "@/db";
import { licenses } from "@/db/schema";
import { currentUser, forbidden, json, unauthorized } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { planDays, stateOf } from "@/lib/plans";
import { serialize } from "../route";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/keys/:id  { status?, deviceId?, customer?, note?, extendDays? } */
export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;

  const rows = await db.select().from(licenses).where(eq(licenses.id, id)).limit(1);
  const existing = rows[0];
  if (!existing) return json({ error: "Key not found." }, 404);

  const isOwner = user.role === "owner";
  const isIssuer = existing.issuedBy === user.id;
  if (!isOwner && !isIssuer) return forbidden();

  let body: {
    status?: string;
    deviceId?: string | null;
    customer?: string;
    note?: string;
    extendDays?: number;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const patch: Partial<typeof licenses.$inferInsert> = {};
  if (body.status === "revoked" || body.status === "active") {
    patch.status = body.status;
  }
  if (typeof body.deviceId === "string") {
    patch.deviceId = body.deviceId.trim().slice(0, 128) || null;
  }
  if (typeof body.customer === "string") {
    patch.customer = body.customer.trim().slice(0, 80);
  }
  if (typeof body.note === "string") {
    patch.note = body.note.trim().slice(0, 240);
  }
  if (typeof body.extendDays === "number" && body.extendDays > 0) {
    const base = Math.max(
      existing.expiresAt.getTime(),
      stateOf(existing.status, existing.expiresAt) === "expired"
        ? Date.now()
        : existing.expiresAt.getTime(),
    );
    patch.expiresAt = new Date(base + body.extendDays * 86400000);
    patch.status = "active";
  }
  if (Object.keys(patch).length === 0) {
    return json({ error: "Nothing to update." }, 400);
  }

  const updated = await db
    .update(licenses)
    .set(patch)
    .where(eq(licenses.id, id))
    .returning();

  const action =
    body.status === "revoked"
      ? "key_revoked"
      : body.status === "active"
        ? "key_restored"
        : typeof body.extendDays === "number"
          ? "key_extended"
          : "key_edited";
  await logAction(user.username, action, updated[0].key);
  return json({ ok: true, key: serialize(updated[0]) });
}

/** DELETE /api/keys/:id — Master Owner only (audit trail is preserved in Activity) */
export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  const user = await currentUser();
  if (!user) return unauthorized();
  if (user.role !== "owner") return forbidden();
  const { id } = await params;
  const rows = await db.select().from(licenses).where(eq(licenses.id, id)).limit(1);
  if (!rows[0]) return json({ error: "Key not found." }, 404);
  await db.delete(licenses).where(eq(licenses.id, id));
  await logAction(user.username, "key_deleted", rows[0].key);
  return json({ ok: true });
}

/** GET /api/keys/:id — single key detail (owner or issuer) */
export async function GET(_req: Request, { params }: Params): Promise<Response> {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const rows = await db.select().from(licenses).where(eq(licenses.id, id)).limit(1);
  if (!rows[0]) return json({ error: "Key not found." }, 404);
  if (user.role !== "owner" && rows[0].issuedBy !== user.id) return forbidden();
  const days = planDays(rows[0].plan);
  return json({ key: { ...serialize(rows[0]), days } });
}
