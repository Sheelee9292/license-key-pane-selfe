import { desc } from "drizzle-orm";
import { db } from "@/db";
import { activity } from "@/db/schema";
import { currentUser, json, unauthorized } from "@/lib/auth";

/** GET /api/activity — recent audit trail (owner sees all, resellers see their own). */
export async function GET(req: Request): Promise<Response> {
  const user = await currentUser();
  if (!user) return unauthorized();
  const url = new URL(req.url);
  const limit = Math.min(200, Number(url.searchParams.get("limit")) || 60);
  const rows = await db
    .select()
    .from(activity)
    .orderBy(desc(activity.at))
    .limit(limit);
  const list =
    user.role === "owner"
      ? rows
      : rows.filter(
          (r) => r.actor === user.username || r.actor === "system",
        );
  return json({
    activity: list.map((r) => ({
      id: r.id,
      at: r.at.toISOString(),
      actor: r.actor,
      action: r.action,
      detail: r.detail,
    })),
  });
}
