"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PLANS, type PlanId } from "@/lib/plans";

type KeyRow = {
  id: string;
  key: string;
  plan: string;
  days: number;
  deviceId: string | null;
  customer: string;
  note: string;
  status: string;
  state: "active" | "expired" | "revoked";
  issuerName: string;
  issuerUsername: string;
  expiresAt: string;
  createdAt: string;
  activations: number;
  lastSeenAt: string | null;
};

type Counts = { active: number; expired: number; revoked: number };

const WA = "966594534381";
const TG = "Shakeel9292";

export default function KeysPage() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ active: 0, expired: 0, revoked: 0 });
  const [state, setState] = useState("");
  const [plan, setPlan] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // generate form
  const [gPlan, setGPlan] = useState<PlanId>("1m");
  const [gDevice, setGDevice] = useState("");
  const [gCustomer, setGCustomer] = useState("");
  const [gNote, setGNote] = useState("");
  const [gBusy, setGBusy] = useState(false);
  const [issued, setIssued] = useState<KeyRow | null>(null);
  const [flash, setFlash] = useState("");
  const [copied, setCopied] = useState("");

  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (plan) params.set("plan", plan);
    if (q) params.set("q", q);
    fetch(`/api/keys?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setKeys(d.keys || []);
        if (d.counts) setCounts(d.counts);
      })
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, [state, plan, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 260 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setGBusy(true);
    setFlash("");
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: gPlan,
          deviceId: gDevice,
          customer: gCustomer,
          note: gNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFlash(data.error || "Could not generate the key.");
        return;
      }
      setIssued(data.key);
      setGDevice("");
      setGCustomer("");
      setGNote("");
      load();
    } finally {
      setGBusy(false);
    }
  }

  async function act(id: string, patch: Record<string, unknown>, label: string) {
    const res = await fetch(`/api/keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setFlash(data.error || "Action failed.");
      return;
    }
    setFlash(`${label} ✓ ${data.key.key}`);
    setIssued(null);
    setConfirmId(null);
    load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setFlash(d.error || "Delete failed.");
      return;
    }
    setFlash("Key deleted from ledger.");
    setConfirmId(null);
    load();
  }

  function copy(text: string, tag: string) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(tag);
      setTimeout(() => setCopied(""), 1600);
    });
  }

  const shareText = useMemo(() => {
    if (!issued) return "";
    const planLabel = PLANS.find((p) => p.id === issued.plan)?.label ?? issued.plan;
    return `Mr. Shakeel License Key\n\nKey: ${issued.key}\nPlan: ${planLabel}\n${
      issued.deviceId ? `Device: ${issued.deviceId}\n`
        : `Device: (free — will bind on first use)\n`
    }Expires: ${new Date(issued.expiresAt).toLocaleString()}\n\nOpen Mr. Shakeel v2.5.8 → Activate License Key → paste → ACTIVATE.`;
  }, [issued]);

  return (
    <div className="space-y-7">
      <header className="border-b-2 border-ink pb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-stamp mb-1.5">
            key counter
          </div>
          <h1 className="font-display text-[42px] sm:text-6xl leading-[0.95] tracking-tight">
            License <span className="italic">ledger</span>
          </h1>
        </div>
        <div className="flex gap-2 font-mono text-[10px] tracking-[0.16em] uppercase">
          <Stat label="active" value={counts.active} cls="text-ok border-ok" />
          <Stat label="expired" value={counts.expired} cls="text-warn border-warn" />
          <Stat label="revoked" value={counts.revoked} cls="text-stamp border-stamp" />
        </div>
      </header>

      {flash && (
        <div className="animate-slip border-l-4 border-ink bg-paper-2 px-4 py-2.5 font-mono text-[12px] flex items-center justify-between gap-3">
          <span className="truncate">{flash}</span>
          <button onClick={() => setFlash("")} className="text-ink-3 shrink-0">✕</button>
        </div>
      )}

      {/* ---------------- generate ---------------- */}
      <section className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <form onSubmit={generate} className="border border-ink bg-paper-2/40">
          <div className="bg-ink text-paper px-4 py-2 font-mono text-[10px] tracking-[0.28em] uppercase flex justify-between">
            <span>new license voucher</span>
            <span className="text-paper/50">form 2.5.8-A</span>
          </div>

          <div className="p-4 sm:p-5 space-y-5">
            {/* plan chooser */}
            <div>
              <Label>duration plan</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {PLANS.map((p) => {
                  const on = gPlan === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setGPlan(p.id)}
                      className={`relative border-2 px-2 py-3 text-left transition-all ${
                        on
                          ? "border-stamp bg-stamp-soft"
                          : "border-rule bg-paper hover:border-ink-3"
                      }`}
                    >
                      <div className={`font-display text-2xl leading-none ${on ? "text-stamp" : ""}`}>
                        {p.short}
                      </div>
                      <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-ink-2 mt-1">
                        {p.days} days
                      </div>
                      <div className="font-mono text-[9px] text-ink-3 mt-0.5 truncate">
                        {p.label.replace(" Plan", "")}
                      </div>
                      {on && (
                        <span className="absolute -top-2 -right-2 bg-stamp text-white font-mono text-[8px] px-1.5 py-0.5 rotate-6">
                          SEL
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>customer device ID (optional)</Label>
                <input
                  className="field mt-1.5"
                  placeholder="paste the device ID they sent"
                  value={gDevice}
                  onChange={(e) => setGDevice(e.target.value)}
                  maxLength={128}
                />
                <p className="mt-1 font-mono text-[9.5px] text-ink-3">
                  leaves the key free to bind on first activation
                </p>
              </div>
              <div>
                <Label>customer name / number</Label>
                <input
                  className="field mt-1.5"
                  placeholder="e.g. Ali — 05x…"
                  value={gCustomer}
                  onChange={(e) => setGCustomer(e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>

            <div>
              <Label>note (private)</Label>
              <input
                className="field mt-1.5"
                placeholder="payment received, sold by reseller…"
                value={gNote}
                onChange={(e) => setGNote(e.target.value)}
                maxLength={240}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button className="btn btn-stamp" disabled={gBusy}>
                {gBusy ? "stamping…" : "generate key"}
              </button>
              <span className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">
                {PLANS.find((p) => p.id === gPlan)?.days} days from now
              </span>
            </div>
          </div>
          {/* perforated tear line */}
          <div className="h-3 perf-x border-t-2 border-dashed border-rule" />
          <div className="px-4 py-2 font-mono text-[9.5px] tracking-[0.16em] uppercase text-ink-3 flex justify-between">
            <span>mr. shakeel · v2.5.8</span>
            <span>panel copy — retain</span>
          </div>
        </form>

        {/* issued voucher */}
        <aside className="lg:sticky lg:top-24">
          {!issued ? (
            <div className="border border-dashed border-rule p-5 text-center">
              <div className="font-display text-3xl leading-tight text-ink-3">
                freshly stamped keys
              </div>
              <p className="mt-2 font-mono text-[11px] text-ink-3 leading-relaxed">
                Generate a key and it appears here as a tear-off voucher — copy
                it, or send it straight to the customer on WhatsApp / Telegram.
              </p>
            </div>
          ) : (
            <div className="border-2 border-ink bg-[#fbf8f1] animate-slip shadow-[6px_6px_0_rgba(22,19,14,0.14)]">
              <div className="bg-ok text-white px-4 py-2 font-mono text-[10px] tracking-[0.28em] uppercase flex justify-between">
                <span>issued · valid</span>
                <span className="live-dot">●</span>
              </div>
              <div className="p-4">
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-3">
                  license key
                </div>
                <div className="font-mono text-lg sm:text-xl font-bold tracking-wider break-all mt-1">
                  {issued.key}
                </div>
                <dl className="mt-3 space-y-1 font-mono text-[11px]">
                  <Line k="plan" v={PLANS.find((p) => p.id === issued.plan)?.label || issued.plan} />
                  <Line k="expires" v={new Date(issued.expiresAt).toLocaleString()} />
                  <Line k="device" v={issued.deviceId || "unbound (free)"} />
                  {issued.customer && <Line k="customer" v={issued.customer} />}
                </dl>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    onClick={() => copy(issued.key, "key")}
                    className="btn btn-ink"
                  >
                    {copied === "key" ? "copied ✓" : "copy key"}
                  </button>
                  <button
                    onClick={() => copy(shareText, "share")}
                    className="btn btn-ghost"
                  >
                    {copied === "share" ? "copied ✓" : "copy message"}
                  </button>
                  <a
                    href={`https://wa.me/${WA}?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost col-span-2"
                  >
                    send on whatsapp
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      "https://t.me/" + TG,
                    )}&text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost col-span-2"
                  >
                    send on telegram
                  </a>
                </div>

                <button
                  onClick={() => setIssued(null)}
                  className="mt-3 w-full font-mono text-[10px] tracking-[0.18em] uppercase text-ink-3 hover:text-stamp"
                >
                  dismiss voucher
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>

      {/* ---------------- filters ---------------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex border border-rule">
            {[
              { v: "", l: "all" },
              { v: "active", l: "active" },
              { v: "expired", l: "expired" },
              { v: "revoked", l: "revoked" },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setState(f.v)}
                className={`px-3 py-2 font-mono text-[10px] tracking-[0.16em] uppercase border-r border-rule last:border-r-0 ${
                  state === f.v ? "bg-ink text-paper" : "hover:bg-paper-2"
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>

          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="field w-auto py-2"
          >
            <option value="">all plans</option>
            {PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <input
            className="field w-auto flex-1 min-w-[180px] py-2"
            placeholder="search key / device / customer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* ---------------- ledger ---------------- */}
        <div className="border border-rule bg-paper-2/30">
          <div className="hidden md:grid grid-cols-[16px_1.4fr_60px_1fr_110px_150px] gap-3 px-3 py-2 bg-ink text-paper font-mono text-[9.5px] tracking-[0.18em] uppercase">
            <span />
            <span>license key</span>
            <span>plan</span>
            <span>device / customer</span>
            <span>expires</span>
            <span className="text-right">actions</span>
          </div>

          {loading && (
            <div className="px-4 py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3 animate-pulse">
              reading ledger…
            </div>
          )}

          {!loading && keys.length === 0 && (
            <div className="px-4 py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
              no keys match this filter
            </div>
          )}

          {keys.map((k, i) => {
            const planMeta = PLANS.find((p) => p.id === k.plan);
            const isConfirm = confirmId === k.id;
            return (
              <div
                key={k.id}
                className="ledger-row animate-row border-b border-rule last:border-b-0 px-3 py-3 md:grid md:grid-cols-[16px_1.4fr_60px_1fr_110px_150px] md:gap-3 md:items-center"
                style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}
              >
                <span
                  className={`hidden md:block h-2.5 w-2.5 rounded-full ${
                    k.state === "active"
                      ? "bg-ok"
                      : k.state === "expired"
                        ? "bg-warn"
                        : "bg-stamp"
                  }`}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[13px] sm:text-[14px] font-semibold break-all">
                      {k.key}
                    </code>
                    <button
                      onClick={() => copy(k.key, k.id)}
                      className="font-mono text-[9px] uppercase tracking-wider border border-rule px-1.5 py-0.5 hover:border-ink shrink-0"
                    >
                      {copied === k.id ? "✓" : "copy"}
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StateTag state={k.state} />
                    <span className="font-mono text-[9.5px] text-ink-3 uppercase tracking-wider">
                      by {k.issuerUsername || "—"}
                      {k.activations > 0 && ` · used ${k.activations}×`}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-[11px] mt-2 md:mt-0">
                  <span className="md:hidden text-ink-3 uppercase text-[9px] tracking-wider block">
                    plan
                  </span>
                  {planMeta?.short || k.plan}
                  <span className="text-ink-3"> · {k.days}d</span>
                </div>

                <div className="min-w-0 mt-1 md:mt-0">
                  <span className="md:hidden font-mono text-[9px] uppercase tracking-wider text-ink-3 block">
                    device / customer
                  </span>
                  <div className="font-mono text-[11px] truncate">
                    {k.deviceId || <span className="text-ink-3">unbound</span>}
                  </div>
                  {(k.customer || k.note) && (
                    <div className="text-[11px] text-ink-2 truncate">
                      {k.customer}
                      {k.customer && k.note && " · "}
                      {k.note}
                    </div>
                  )}
                </div>

                <div className="font-mono text-[11px] tabular mt-1 md:mt-0">
                  <span className="md:hidden font-mono text-[9px] uppercase tracking-wider text-ink-3 block">
                    expires
                  </span>
                  {new Date(k.expiresAt).toLocaleDateString(undefined, {
                    year: "2-digit",
                    month: "short",
                    day: "2-digit",
                  })}
                  <div className="text-ink-3 text-[10px]">
                    {new Date(k.expiresAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="mt-2 md:mt-0 md:text-right">
                  {isConfirm ? (
                    <div className="flex flex-wrap gap-1.5 md:justify-end animate-slip">
                      <button
                        onClick={() =>
                          k.state === "revoked"
                            ? act(k.id, { status: "active" }, "restored")
                            : act(k.id, { status: "revoked" }, "revoked")
                        }
                        className="font-mono text-[9.5px] uppercase tracking-wider bg-stamp text-white px-2 py-1"
                      >
                        sure?
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="font-mono text-[9.5px] uppercase tracking-wider border border-rule px-2 py-1"
                      >
                        no
                      </button>
                      <button
                        onClick={() => remove(k.id)}
                        className="font-mono text-[9.5px] uppercase tracking-wider border border-stamp text-stamp px-2 py-1"
                      >
                        delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 md:justify-end">
                      <MiniBtn
                        onClick={() =>
                          k.state === "revoked"
                            ? act(k.id, { status: "active" }, "restored")
                            : act(k.id, { status: "revoked" }, "revoked")
                        }
                        tone={k.state === "revoked" ? "ok" : "stamp"}
                      >
                        {k.state === "revoked" ? "restore" : "revoke"}
                      </MiniBtn>
                      <MiniBtn
                        onClick={() => act(k.id, { extendDays: k.days }, "extended")}
                      >
                        +{k.days}d
                      </MiniBtn>
                      <MiniBtn onClick={() => setConfirmId(k.id)} tone="mute">
                        ···
                      </MiniBtn>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">
          showing {keys.length} of {counts.active + counts.expired + counts.revoked} keys ·
          resellers only see their own · the master owner sees everything
        </p>
      </section>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-3">
      {children}
    </span>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed border-rule pb-1">
      <dt className="uppercase tracking-wider text-ink-3 shrink-0">{k}</dt>
      <dd className="text-right truncate">{v}</dd>
    </div>
  );
}

function StateTag({ state }: { state: string }) {
  const map: Record<string, string> = {
    active: "border-ok text-ok",
    expired: "border-warn text-warn",
    revoked: "border-stamp text-stamp",
  };
  return (
    <span
      className={`border px-1.5 py-[1px] font-mono text-[9px] font-bold tracking-[0.16em] uppercase ${map[state] || "border-rule text-ink-3"}`}
    >
      {state}
    </span>
  );
}

function MiniBtn({
  children,
  onClick,
  tone = "ink",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "ink" | "stamp" | "ok" | "mute";
}) {
  const tones: Record<string, string> = {
    ink: "border-ink hover:bg-ink hover:text-paper",
    stamp: "border-stamp text-stamp hover:bg-stamp hover:text-white",
    ok: "border-ok text-ok hover:bg-ok hover:text-white",
    mute: "border-rule text-ink-3 hover:border-ink hover:text-ink",
  };
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[9.5px] uppercase tracking-wider border px-2 py-1 transition-colors ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <span className={`border px-2 py-1 ${cls}`}>
      {value} {label}
    </span>
  );
}
