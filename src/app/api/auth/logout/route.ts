import { currentUser, destroySession, json } from "@/lib/auth";
import { logAction } from "@/lib/log";

export async function POST(): Promise<Response> {
  const user = await currentUser();
  await destroySession();
  if (user) await logAction(user.username, "logout", "Signed out");
  return json({ ok: true });
}
