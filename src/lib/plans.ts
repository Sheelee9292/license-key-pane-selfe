export type PlanId = "3d" | "1m" | "3m";

export type Plan = {
  id: PlanId;
  days: number;
  label: string;
  short: string;
  priceHint: string;
};

/** The exact three duration plans required by Mr. Shakeel v2.5.8 */
export const PLANS: Plan[] = [
  {
    id: "3d",
    days: 3,
    label: "3 Days Plan",
    short: "3D",
    priceHint: "3 days",
  },
  {
    id: "1m",
    days: 30,
    label: "1 Month Plan (30 Days)",
    short: "1M",
    priceHint: "30 days",
  },
  {
    id: "3m",
    days: 90,
    label: "3 Months Plan (90 Days)",
    short: "3M",
    priceHint: "90 days",
  },
];

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function planDays(id: string): number {
  return planById(id)?.days ?? 0;
}

export type LicenseState = "active" | "expired" | "revoked";

/** Effective status shown in the panel and returned to the app. */
export function stateOf(
  status: string,
  expiresAt: Date | string | null,
): LicenseState {
  if (status === "revoked") return "revoked";
  const exp = expiresAt ? new Date(expiresAt) : null;
  if (exp && exp.getTime() <= Date.now()) return "expired";
  return "active";
}

export function daysLeft(expiresAt: Date | string | null): number {
  const exp = expiresAt ? new Date(expiresAt).getTime() : 0;
  return Math.max(0, Math.ceil((exp - Date.now()) / 86400000));
}

/** Mr. Shakeel license key format: MS258-XXXX-XXXX-XXXX */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars

export function generateKey(): string {
  const block = () =>
    Array.from({ length: 4 }, () =>
      ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length)),
    ).join("");
  return `MS258-${block()}-${block()}-${block()}`;
}
