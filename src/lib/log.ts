import { db } from "@/db";
import { activity } from "@/db/schema";

export async function logAction(
  actor: string,
  action: string,
  detail = "",
): Promise<void> {
  try {
    await db.insert(activity).values({ actor, action, detail });
  } catch {
    // logging must never break a request
  }
}
