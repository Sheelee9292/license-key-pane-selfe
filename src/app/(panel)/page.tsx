"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Counts = { active: number; expired: number; revoked: number; total: number };
type Act = { id: number; at: string; actor: string; action: string; detail: string };

const ACTION_LABEL: Record<string, string> = {
  key_created: "key issued",
  key_revoked: "key revoked",
  key_restored: "key restored",
  key_extended: "key extended",
  key_deleted: "key deleted",
  key_edited: "key edited",
  login: "signed in",
  logout: "signed out",
  user_created: "reseller created",
  user_edited: "reseller edited",
  user_blocked: "reseller blocked",
  user_deleted: "reseller deleted",
  master_seeded: "master owner seeded",
  key_activated: "app activation",
  verify_failed: "verify failed",
  verify_expired: "verify expired",
  verify_revoked: "verify revoked",
  verify_device_mismatch: "device mismatch",
};

export default function BureauPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [activity, setActivity] = useState<Act[]>([]);
  const [keys, setKeys] = useState<
    { id: string; key: string; plan: string; state: string; expiresAt: string; customer: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/keys")
      .then((r) => r.json())
      .then((d) => {
        setCounts(d.counts ? { ...d.counts, total: d.total } : null);
        setKeys((d.keys || []).slice(0, 6));
      })
      .catch(() => setCounts({ active: 0, expired: 0, revoked: 0, total: 0 }));
    fetch("/api/activity?limit=14")
      .then((r) => r.json())
      .then((d) => setActivity(d.activity || []))
      .catch(() => setActivity([]));
  }, []);

  const tiles = [
    { label: "active keys", value: counts?.active, tone: "text-ok", rule: "border-ok" },
    { label: "expired", value: counts?.expired, tone: "text-warn", rule: "border-warn" },
    { label: "revoked", value: counts?.revoked, tone: "text-stamp", rule: "border-stamp" },
    { label: "issued total", value: counts?.total, tone: "text-ink", rule: "border-ink" },
  ];

  return (
    <div className="space-y-8">
      {/* headline */}
      <header className="border-b-2 border-ink pb-5">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-stamp mb-1.5">
          front desk · overview
        </div>
        <h1 className="font-display text-[42px] sm:text-6xl leading-[0.95] tracking-tight">
          Today at the <span className="italic">bureau</span>
        </h1>
        <p className="mt-2.5 text-sm text-ink-2 max-w-xl">
          Every key issued by you or your resellers, checked against device ID
          and expiry — live from the Mr. Shakeel app.
        </p>
      </header>

      {/* stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={`border ${t.rule} border-l-[5px] bg-paper-2/50 px-4 py-4`}
          >
            <div className={`font-display text-5xl leading-none tabular ${t.tone}`}>
              {t.value ?? "–"}
            </div>
            <div className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase text-ink-3">
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {/* actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/keys" className="btn btn-stamp">
          + generate license key
        </Link>
        <Link href="/users" className="btn btn-ghost">
          manage resellers
        </Link>
        <Link href="/guide" className="btn btn-ghost">
          free hosting setup
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* latest keys */}
        <section>
          <SectionTitle eyebrow="ledger" title="Latest keys" href="/keys" />
          <div className="border border-rule divide-y divide-rule">
            {keys.length === 0 && (
              <Empty text="No keys yet. Issue the first one." />
            )}
            {keys.map((k, i) => (
              <div
                key={k.id}
                className="ledger-row animate-row flex items-center gap-3 px-3 py-2.5"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <StateDot state={k.state} />
                <code className="font-mono text-[12px] sm:text-[13px] truncate flex-1">
                  {k.key}
                </code>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3 shrink-0">
                  {k.plan}
                </span>
                <span className="font-mono text-[10px] text-ink-3 shrink-0 hidden sm:block">
                  {new Date(k.expiresAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* activity */}
        <section>
          <SectionTitle eyebrow="audit trail" title="Recent activity" />
          <div className="border border-rule divide-y divide-rule max-h-[340px] overflow-y-auto">
            {activity.length === 0 && <Empty text="Nothing logged yet." />}
            {activity.map((a, i) => (
              <div
                key={a.id}
                className="animate-row px-3 py-2.5 flex gap-3 items-baseline"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="font-mono text-[10px] text-ink-3 shrink-0 tabular">
                  {new Date(a.at).toLocaleString(undefined, {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-stamp shrink-0 w-[86px] truncate">
                  {ACTION_LABEL[a.action] || a.action}
                </span>
                <span className="text-[12px] text-ink-2 truncate">
                  <b className="text-ink font-mono text-[11px]">{a.actor}</b>{" "}
                  {a.detail}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  href,
}: {
  eyebrow: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-2">
      <div>
        <div className="font-mono text-[9px] tracking-[0.28em] uppercase text-ink-3">
          {eyebrow}
        </div>
        <h2 className="font-display text-2xl leading-none">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="font-mono text-[10px] tracking-[0.18em] uppercase text-stamp hover:underline"
        >
          open →
        </Link>
      )}
    </div>
  );
}

function StateDot({ state }: { state: string }) {
  const color =
    state === "active" ? "bg-ok" : state === "expired" ? "bg-warn" : "bg-stamp";
  return <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="px-4 py-8 text-center font-mono text-[11px] tracking-wider uppercase text-ink-3">
      {text}
    </div>
  );
}
