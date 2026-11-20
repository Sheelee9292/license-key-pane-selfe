import { eq } from "drizzle-orm";
import { db } from "@/db";
import { licenses, users } from "@/db/schema";
import { json } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { planById, stateOf } from "@/lib/plans";

/**
 * PUBLIC endpoint used by the Mr. Shakeel Android app (v2.5.8).
 *
 * POST /api/verify
 *   { "key": "MS258-....", "deviceId": "abc123", "plan": "1m", "action": "activate" | "check" }
 *
 * Rules enforced:
 *   1. key must exist
 *   2. key must not be revoked / blocked
 *   3. key must not be expired (expires_at > now)
 *   4. if the key is bound to a device, deviceId must match
 *   5. if unbound, first activation binds it to the device permanently
 *   6. selected plan must equal the plan the key was issued for
 */
async function handle(req: Request): Promise<Response> {
  let body: {
    key?: string;
    deviceId?: string;
    plan?: string;
    action?: string;
    app?: string;
    version?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, code: "BAD_REQUEST", message: "Invalid request." }, 400);
  }

  const key = (body.key || "").trim().toUpperCase();
  const deviceId = (body.deviceId || "").trim();
  const plan = (body.plan || "").trim();
  const action = body.action === "check" ? "check" : "activate";

  if (!key) {
    return json({ ok: false, code: "NO_KEY", message: "Enter license key." }, 400);
  }
  if (!deviceId) {
    return json(
      { ok: false, code: "NO_DEVICE", message: "Device ID missing." },
      400,
    );
  }

  const rows = await db.select().from(licenses).where(eq(licenses.key, key)).limit(1);
  const lic = rows[0];
  if (!lic) {
    await logAction("app", "verify_failed", `Unknown key ${key}`);
    return json(
      {
        ok: false,
        code: "NOT_FOUND",
        message: "Invalid license key. Check and try again.",
      },
      404,
    );
  }

  const state = stateOf(lic.status, lic.expiresAt);
  if (state === "revoked") {
    await logAction("app", "verify_revoked", `${key} / device ${deviceId}`);
    return json(
      {
        ok: false,
        code: "REVOKED",
        message: "This license has been revoked or blocked.",
      },
      403,
    );
  }
  if (state === "expired") {
    await logAction("app", "verify_expired", `${key} / device ${deviceId}`);
    return json(
      {
        ok: false,
        code: "EXPIRED",
        message: "This license has expired. Buy a new plan.",
      },
      403,
    );
  }

  if (lic.deviceId && lic.deviceId !== deviceId) {
    await logAction(
      "app",
      "verify_device_mismatch",
      `${key} bound to ${lic.deviceId}, got ${deviceId}`,
    );
    return json(
      {
        ok: false,
        code: "DEVICE_MISMATCH",
        message: "This key is bound to a different device.",
      },
      403,
    );
  }

  if (plan) {
    const issuedPlan = planById(lic.plan);
    if (!issuedPlan || issuedPlan.id !== plan) {
      return json(
        {
          ok: false,
          code: "PLAN_MISMATCH",
          message: `This key is for ${issuedPlan?.label ?? "another plan"}.`,
        },
        400,
      );
    }
  }

  if (action === "activate") {
    const firstActivation = !lic.deviceId;
    const next = await db
      .update(licenses)
      .set({
        deviceId: lic.deviceId || deviceId,
        activatedAt: lic.activatedAt || new Date(),
        lastSeenAt: new Date(),
        activations: lic.activations + 1,
      })
      .where(eq(licenses.id, lic.id))
      .returning();
    if (firstActivation) {
      await logAction("app", "key_activated", `${key} bound to ${deviceId}`);
    }
    return json(success(next[0], action));
  }

  await db
    .update(licenses)
    .set({ lastSeenAt: new Date() })
    .where(eq(licenses.id, lic.id));
  return json(success(lic, action));
}

function success(lic: typeof licenses.$inferSelect, action: string) {
  const issuedPlan = planById(lic.plan);
  const msLeft = new Date(lic.expiresAt).getTime() - Date.now();
  return {
    ok: true,
    action,
    code: "OK",
    message: action === "activate" ? "License activated." : "License is valid.",
    license: {
      key: lic.key,
      plan: lic.plan,
      planLabel: issuedPlan?.label ?? lic.plan,
      days: lic.days,
      status: "active",
      expiresAt: lic.expiresAt.toISOString(),
      msLeft,
      daysLeft: Math.max(0, Math.ceil(msLeft / 86400000)),
      deviceId: lic.deviceId,
      boundAt: (lic.activatedAt || lic.createdAt).toISOString(),
    },
    app: { name: "Mr. Shakeel", version: "2.5.8" },
  };
}

export async function POST(req: Request): Promise<Response> {
  return handle(req);
}

/** GET /api/verify?key=..&deviceId=..&plan=.. — read-only status poll for the app. */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const synthetic = {
    json: async () => ({
      key: url.searchParams.get("key") || "",
      deviceId: url.searchParams.get("deviceId") || "",
      plan: url.searchParams.get("plan") || "",
      action: "check",
    }),
  } as unknown as Request;
  return handle(synthetic);
}

/** GET /api/verify without params → panel reachability probe for the app splash screen. */
export async function OPTIONS(): Promise<Response> {
  return json({
    ok: true,
    service: "mr-shakeel-license-panel",
    app: "Mr. Shakeel",
    version: "2.5.8",
    plans: ["3d", "1m", "3m"],
  });
}
