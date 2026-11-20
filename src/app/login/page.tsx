"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Seal } from "@/components/Seal";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* ---------- visual half ---------- */}
      <div className="relative overflow-hidden bg-ink min-h-[220px] lg:min-h-dvh">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/login-bg.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-70 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/85 via-ink/40 to-stamp/25" />
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 text-paper">
          <div className="flex items-center gap-3">
            <Seal className="h-14 w-14 text-paper" />
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-paper/70 leading-relaxed">
              license bureau
              <br />
              est. for mr. shakeel
            </div>
          </div>

          <div className="hidden lg:block">
            <h1 className="font-display text-[64px] xl:text-[76px] leading-[0.92] tracking-tight">
              Keys, plans
              <br />
              <span className="italic text-stamp-soft">&amp; devices</span>
              <br />
              under one seal.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/75">
              Master Owner control over every reseller, every key and every
              expiry date — for <strong className="text-paper">Mr. Shakeel
              v2.5.8</strong>. 3 Days · 1 Month · 3 Months. Runs 100% free and
              works from your phone browser.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] tracking-[0.18em] uppercase">
              {["3 days", "1 month · 30d", "3 months · 90d"].map((p) => (
                <span key={p} className="border border-paper/30 px-2.5 py-1">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-paper/45 flex justify-between">
            <span>whatsapp +966594534381</span>
            <span className="hidden sm:inline">telegram @shakeel9292</span>
          </div>
        </div>
      </div>

      {/* ---------- form half ---------- */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-sm animate-slip">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-stamp mb-2">
            restricted access
          </div>
          <h2 className="font-display text-4xl sm:text-5xl leading-none mb-1">
            Panel sign-in
          </h2>
          <p className="text-sm text-ink-2 mb-7">
            Master Owner &amp; authorized resellers only.
          </p>

          <label className="block mb-4">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-3">
              username
            </span>
            <input
              className="field mt-1.5"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoComplete="username"
              placeholder="owner"
              required
            />
          </label>

          <label className="block mb-5">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-3">
              password
            </span>
            <input
              className="field mt-1.5"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>

          {error && (
            <div className="mb-4 border-l-4 border-stamp bg-stamp-soft px-3 py-2 text-sm text-stamp animate-slip">
              {error}
            </div>
          )}

          <button className="btn btn-ink w-full" disabled={busy}>
            {busy ? "Verifying…" : "Enter the bureau"}
          </button>

          <div className="mt-6 border border-dashed border-rule p-3 font-mono text-[11px] leading-relaxed text-ink-2">
            <span className="text-stamp">first run?</span> the panel creates the
            Master Owner automatically — username{" "}
            <b className="text-ink">owner</b>, password{" "}
            <b className="text-ink">shakeel258</b>. Change it from{" "}
            <b className="text-ink">Account</b> right after you sign in.
          </div>
        </form>
      </div>
    </div>
  );
}
