"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = {
  id: string;
  username: string;
  name: string;
  role: string;
  maxKeys: number | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace("/login");
        else {
          setMe(d.user);
          setName(d.user.name || "");
        }
      });
  }, [router]);

  async function save() {
    setErr("");
    setMsg("");
    if (pw1 && pw1.length < 6) {
      setErr("New password must be at least 6 characters.");
      return;
    }
    if (pw1 && pw1 !== pw2) {
      setErr("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const body: Record<string, unknown> = { name };
      if (pw1) body.password = pw1;
      const res = await fetch(`/api/users/${me?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Could not save.");
        return;
      }
      setMsg(pw1 ? "Password updated. Use it next sign-in." : "Name updated.");
      setPw1("");
      setPw2("");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (!me) {
    return (
      <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 animate-pulse py-20 text-center">
        loading account…
      </div>
    );
  }

  const isOwner = me.role === "owner";

  return (
    <div className="space-y-7 max-w-2xl">
      <header className="border-b-2 border-ink pb-5">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-stamp mb-1.5">
          credentials
        </div>
        <h1 className="font-display text-[42px] sm:text-6xl leading-[0.95] tracking-tight">
          Your <span className="italic">account</span>
        </h1>
      </header>

      <div className="border border-ink bg-ink text-paper p-5">
        <div className="font-mono text-[9.5px] tracking-[0.26em] uppercase text-stamp-soft">
          {isOwner ? "master owner · supreme control" : "reseller · limited access"}
        </div>
        <div className="font-display text-4xl leading-none mt-1.5">
          {me.name || me.username}
        </div>
        <div className="font-mono text-[11.5px] text-paper/60 mt-1">
          @{me.username} ·{" "}
          {isOwner
            ? "sees and controls every key and account"
            : `can issue up to ${me.maxKeys === null ? "unlimited" : me.maxKeys} keys`}
        </div>
      </div>

      <section className="border border-rule bg-paper-2/40 p-4 sm:p-5 space-y-4">
        <h2 className="font-display text-2xl leading-none">Edit profile</h2>
        <div>
          <Label>display name</Label>
          <input
            className="field mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>new password</Label>
            <input
              className="field mt-1.5"
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              placeholder="leave blank to keep"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>repeat new password</Label>
            <input
              className="field mt-1.5"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="repeat it"
              autoComplete="new-password"
            />
          </div>
        </div>

        {err && (
          <div className="border-l-4 border-stamp bg-stamp-soft px-3 py-2 text-[12.5px] text-stamp">
            {err}
          </div>
        )}
        {msg && (
          <div className="border-l-4 border-ok bg-ok-soft px-3 py-2 text-[12.5px] text-ok">
            {msg}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ink" onClick={save} disabled={busy}>
            {busy ? "saving…" : "save changes"}
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            sign out
          </button>
        </div>
      </section>

      <section className="border border-dashed border-rule p-4">
        <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-3 mb-2">
          security note
        </h3>
        <p className="text-[13px] leading-relaxed text-ink-2">
          Passwords are stored as salted scrypt hashes — never as plain text.
          Sessions live in an HttpOnly cookie for 30 days and are deleted the
          moment you sign out or an account is blocked. The Master Owner can
          block any reseller instantly from the <b>Resellers</b> screen, which
          invalidates their session on their very next request.
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
