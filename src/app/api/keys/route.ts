import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { licenses, users } from "@/db/schema";
import { currentUser, json, unauthorized } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { generateKey, planById, planDays, stateOf } from "@/lib/plans";

type LicenseRow = typeof licenses.$inferSelect;

export function serialize(row: LicenseRow) {
  return {
    id: row.id,
    key: row.key,
    plan: row.plan,
    days: row.days,
    deviceId: row.deviceId,
    customer: row.customer,
    note: row.note,
    status: row.status,
    state: stateOf(row.status, row.expiresAt),
    issuedBy: row.issuedBy,
    activatedAt: row.activatedAt,
    lastSeenAt: row.lastSeenAt,
    activations: row.activations,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/** GET /api/keys?state=active&q=search&plan=1m&issuer=<userId> */
export async function GET(req: Request): Promise<Response> {
  const user = await currentUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const state = url.searchParams.get("state") || "";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const plan = url.searchParams.get("plan") || "";
  const issuer = url.searchParams.get("issuer") || "";

  const rows = await db
    .select({
      license: licenses,
      issuerName: users.name,
      issuerUsername: users.username,
    })
    .from(licenses)
    .leftJoin(users, eq(licenses.issuedBy, users.id))
    .orderBy(desc(licenses.createdAt));

  // Owner sees every key from every reseller. Resellers see only their own.
  let list = rows;
  if (user.role !== "owner") {
    list = list.filter((r) => r.license.issuedBy === user.id);
  }
  if (issuer) list = list.filter((r) => r.license.issuedBy === issuer);
  if (plan) list = list.filter((r) => r.license.plan === plan);
  if (q) {
    list = list.filter((r) => {
      const l = r.license;
      return (
        l.key.toLowerCase().includes(q) ||
        (l.deviceId || "").toLowerCase().includes(q) ||
        l.customer.toLowerCase().includes(q) ||
        l.note.toLowerCase().includes(q)
      );
    });
  }
  if (state === "active" || state === "expired" || state === "revoked") {
    list = list.filter((r) => stateOf(r.license.status, r.license.expiresAt) === state);
  }

  const counts = { active: 0, expired: 0, revoked: 0 };
  const scoped = user.role === "owner"
    ? rows
    : rows.filter((r) => r.license.issuedBy === user.id);
  for (const r of scoped) {
    counts[stateOf(r.license.status, r.license.expiresAt)] += 1;
  }

  return json({
    keys: list.map((r) => ({
      ...serialize(r.license),
      issuerName: r.issuerName || "",
      issuerUsername: r.issuerUsername || "",
    })),
    counts,
    total: scoped.length,
  });
}

/** POST /api/keys  { plan, deviceId?, customer?, note? } */
export async function POST(req: Request): Promise<Response> {
  const user = await currentUser();
  if (!user) return unauthorized();
  let body: {
    plan?: string;
    deviceId?: string;
    customer?: string;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const plan = planById(body.plan || "");
  if (!plan) return json({ error: "Choose a valid duration plan." }, 400);

  // Reseller generation limits (the owner is always unlimited)
  if (user.role !== "owner") {
    if (user.maxKeys !== null) {
      const used = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(licenses)
        .where(eq(licenses.issuedBy, user.id));
      if ((used[0]?.n ?? 0) >= user.maxKeys) {
        return json(
          {
            error: `Key limit reached: this account may issue up to ${user.maxKeys} keys. Ask the Master Owner to raise the cap.`,
          },
          403,
        );
      }
    }
  }

  const deviceId = (body.deviceId || "").trim().slice(0, 128);
  const customer = (body.customer || "").trim().slice(0, 80);
  const note = (body.note || "").trim().slice(0, 240);
  const days = planDays(plan.id);
  const expiresAt = new Date(Date.now() + days * 86400000);

  // Guarantee uniqueness even on the astronomically unlikely collision
  let key = generateKey();
  for (let i = 0; i < 5; i++) {
    const clash = await db
      .select({ id: licenses.id })
      .from(licenses)
      .where(eq(licenses.key, key))
      .limit(1);
    if (clash.length === 0) break;
    key = generateKey();
  }

  const inserted = await db
    .insert(licenses)
    .values({
      key,
      plan: plan.id,
      days,
      deviceId: deviceId || null,
      customer,
      note,
      status: "active",
      issuedBy: user.id,
      expiresAt,
    })
    .returning();

  await logAction(
    user.username,
    "key_created",
    `${plan.label} → ${key}${customer ? ` for ${customer}` : ""}`,
  );
  return json({ ok: true, key: serialize(inserted[0]) }, 201);
}
