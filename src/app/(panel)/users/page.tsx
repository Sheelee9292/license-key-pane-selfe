"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  maxKeys: number | null;
  createdAt: string;
  issued: number;
  activeKeys: number;
};

export default function UsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [maxKeys, setMaxKeys] = useState("");

  const [resetFor, setResetFor] = useState<Row | null>(null);
  const [newPw, setNewPw] = useState("");

  const load = useCallback(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setRows(d.users);
        else if (d.error) setFlash(d.error);
      })
      .catch(() => setFlash("Could not load accounts."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          name,
          password,
          maxKeys: maxKeys ? Number(maxKeys) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Could not create the account.");
        return;
      }
      setFlash(`Reseller @${username} created — share the login with them.`);
      setUsername("");
      setName("");
      setPassword("");
      setMaxKeys("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, msg: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setFlash(res.ok ? msg : data.error || "Action failed.");
    if (res.ok) load();
  }

  async function destroy(row: Row) {
    if (!confirm(`Delete @${row.username} permanently? Their keys stay in the ledger.`))
      return;
    const res = await fetch(`/api/users/${row.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setFlash(res.ok ? `@${row.username} deleted.` : data.error || "Delete failed.");
    if (res.ok) load();
  }

  const owner = rows.find((r) => r.role === "owner");
  const resellers = rows.filter((r) => r.role !== "owner");

  return (
    <div className="space-y-7">
      <header className="border-b-2 border-ink pb-5">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-stamp mb-1.5">
          subordinate access
        </div>
        <h1 className="font-display text-[42px] sm:text-6xl leading-[0.95] tracking-tight">
          Reseller <span className="italic">accounts</span>
        </h1>
        <p className="mt-2.5 text-sm text-ink-2 max-w-2xl">
          Give a sub-user their own panel login so they can issue keys for their
          own customers. You keep supreme control — block them, cap how many keys
          they can issue, or revoke everything they ever created, instantly.
        </p>
      </header>

      {flash && (
        <div className="animate-slip border-l-4 border-ok bg-ok-soft/60 px-4 py-2.5 font-mono text-[12px] flex justify-between gap-3">
          <span className="truncate">{flash}</span>
          <button onClick={() => setFlash("")} className="text-ink-3">✕</button>
        </div>
      )}

      {/* master owner card */}
      {owner && (
        <div className="border-2 border-ink bg-ink text-paper p-4 sm:p-5 flex flex-wrap items-center gap-4 justify-between">
          <div>
            <div className="font-mono text-[9.5px] tracking-[0.26em] uppercase text-stamp-soft">
              supreme control · you
            </div>
            <div className="font-display text-3xl leading-none mt-1">{owner.name}</div>
            <div className="font-mono text-[11px] text-paper/60 mt-1">
              @{owner.username} · unlimited keys · sees every key in the panel
            </div>
          </div>
          <div className="flex gap-4 font-mono text-[11px] uppercase tracking-wider">
            <div className="text-center">
              <div className="font-display text-4xl">{owner.activeKeys}</div>
              <div className="text-paper/50 text-[9px]">active</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl">{owner.issued}</div>
              <div className="text-paper/50 text-[9px]">issued</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_330px] gap-6 items-start">
        {/* reseller table */}
        <section className="border border-rule bg-paper-2/30">
          <div className="bg-ink text-paper px-3 py-2 font-mono text-[9.5px] tracking-[0.18em] uppercase flex justify-between">
            <span>sub-user accounts</span>
            <span>{resellers.length} total</span>
          </div>

          {loading && (
            <div className="px-4 py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3 animate-pulse">
              loading accounts…
            </div>
          )}

          {!loading && resellers.length === 0 && (
            <div className="px-4 py-10 text-center font-mono text-[11px] uppercase tracking-widest text-ink-3">
              no resellers yet — create one on the right
            </div>
          )}

          {resellers.map((r, i) => (
            <div
              key={r.id}
              className="ledger-row animate-row border-b border-rule last:border-b-0 p-3 sm:p-4"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[15px]">{r.name}</span>
                    <span className="font-mono text-[11px] text-ink-2">
                      @{r.username}
                    </span>
                    <span
                      className={`font-mono text-[9px] tracking-[0.16em] uppercase border px-1.5 py-[1px] ${
                        r.active
                          ? "border-ok text-ok"
                          : "border-stamp text-stamp"
                      }`}
                    >
                      {r.active ? "active" : "blocked"}
                    </span>
                  </div>
                  <div className="mt-1.5 font-mono text-[10.5px] text-ink-2 flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>issued: <b className="text-ink">{r.issued}</b></span>
                    <span>live: <b className="text-ok">{r.activeKeys}</b></span>
                    <span>
                      limit:{" "}
                      <b className="text-ink">
                        {r.maxKeys === null ? "unlimited" : r.maxKeys}
                      </b>
                    </span>
                    <span className="text-ink-3">
                      joined {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <MiniBtn
                    onClick={() =>
                      patch(
                        r.id,
                        { active: !r.active },
                        r.active
                          ? `@${r.username} blocked — they cannot sign in.`
                          : `@${r.username} unblocked.`,
                      )
                    }
                    tone={r.active ? "stamp" : "ok"}
                  >
                    {r.active ? "block" : "unblock"}
                  </MiniBtn>
                  <MiniBtn onClick={() => { setResetFor(r); setNewPw(""); }}>
                    reset pw
                  </MiniBtn>
                  <MiniBtn
                    onClick={() =>
                      patch(r.id, { maxKeys: null }, `@${r.username} limit removed.`)
                    }
                    tone="mute"
                  >
                    ∞ limit
                  </MiniBtn>
                  <MiniBtn
                    onClick={() =>
                      confirm(
                        `Revoke EVERY key issued by @${r.username}? Their customers will be locked out immediately.`,
                      ) &&
                      patch(
                        r.id,
                        { revokeKeys: true },
                        `All @${r.username} keys revoked.`,
                      )
                    }
                    tone="stamp"
                  >
                    revoke all
                  </MiniBtn>
                  <MiniBtn onClick={() => destroy(r)} tone="mute">
                    delete
                  </MiniBtn>
                </div>
              </div>

              {/* per-user key cap */}
              <div className="mt-3 flex items-center gap-2 border-t border-dashed border-rule pt-2.5">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-ink-3">
                  max keys
                </span>
                <input
                  type="number"
                  min={1}
                  defaultValue={r.maxKeys ?? ""}
                  placeholder="∞"
                  key={r.id + String(r.maxKeys)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = Number((e.target as HTMLInputElement).value);
                      patch(
                        r.id,
                        { maxKeys: v > 0 ? v : null },
                        `@${r.username} key cap set.`,
                      );
                    }
                  }}
                  className="field w-24 py-1 text-[12px]"
                />
                <button
                  onClick={(e) => {
                    const input = (e.currentTarget.parentElement as HTMLElement)
                      .querySelector("input") as HTMLInputElement;
                    const v = Number(input.value);
                    patch(
                      r.id,
                      { maxKeys: v > 0 ? v : null },
                      `@${r.username} key cap set.`,
                    );
                  }}
                  className="font-mono text-[9.5px] uppercase tracking-wider border border-ink px-2 py-1 hover:bg-ink hover:text-paper"
                >
                  save cap
                </button>
                <span className="font-mono text-[9.5px] text-ink-3">
                  press enter to save
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* create form */}
        <section className="lg:sticky lg:top-24 border-2 border-ink bg-[#fbf8f1]">
          <div className="bg-ink text-paper px-4 py-2 font-mono text-[10px] tracking-[0.26em] uppercase">
            grant panel access
          </div>
          <form onSubmit={create} className="p-4 space-y-3.5">
            <div>
              <Label>username</Label>
              <input
                className="field mt-1.5"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="reseller1"
                autoCapitalize="none"
                required
              />
            </div>
            <div>
              <Label>display name</Label>
              <input
                className="field mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Muhammad (Lahore)"
              />
            </div>
            <div>
              <Label>password (min 6)</Label>
              <input
                className="field mt-1.5"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="at least 6 characters"
                required
                minLength={6}
              />
            </div>
            <div>
              <Label>key limit (optional)</Label>
              <input
                className="field mt-1.5"
                type="number"
                min={1}
                value={maxKeys}
                onChange={(e) => setMaxKeys(e.target.value)}
                placeholder="blank = unlimited"
              />
            </div>

            {err && (
              <div className="border-l-4 border-stamp bg-stamp-soft px-3 py-2 text-[12px] text-stamp">
                {err}
              </div>
            )}

            <button className="btn btn-stamp w-full" disabled={busy}>
              {busy ? "creating…" : "create reseller login"}
            </button>

            <p className="font-mono text-[10px] leading-relaxed text-ink-3">
              They sign in at this same URL, see only their own keys, and you
              keep full oversight from this screen at any time.
            </p>
          </form>
        </section>
      </div>

      {/* reset password modal */}
      {resetFor && (
        <div
          className="fixed inset-0 z-[70] bg-ink/70 flex items-end sm:items-center justify-center p-3"
          onClick={() => setResetFor(null)}
        >
          <div
            className="w-full max-w-sm bg-paper border-2 border-ink animate-slip"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-ink text-paper px-4 py-2 font-mono text-[10px] tracking-[0.24em] uppercase flex justify-between">
              <span>reset password</span>
              <button onClick={() => setResetFor(null)}>✕</button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-ink-2">
                Setting a new password for{" "}
                <b className="text-ink font-mono">@{resetFor.username}</b>. They
                will need the new one next sign-in.
              </p>
              <input
                className="field"
                type="text"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="new password (min 6)"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  className="btn btn-ink flex-1"
                  disabled={newPw.length < 6}
                  onClick={async () => {
                    await patch(
                      resetFor.id,
                      { password: newPw },
                      `Password reset for @${resetFor.username}.`,
                    );
                    setResetFor(null);
                  }}
                >
                  save password
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setResetFor(null)}
                >
                  cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
