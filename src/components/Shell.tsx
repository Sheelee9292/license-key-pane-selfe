"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Seal } from "@/components/Seal";

type User = { id: string; username: string; name: string; role: string };

const NAV = [
  { href: "/", label: "Bureau", icon: "▤" },
  { href: "/keys", label: "Keys", icon: "⌘" },
  { href: "/users", label: "Resellers", icon: "◈", ownerOnly: true },
  { href: "/guide", label: "Setup", icon: "✦" },
  { href: "/account", label: "Account", icon: "●" },
];

export function Shell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isOwner = user.role === "owner";
  const items = NAV.filter((n) => !n.ownerOnly || isOwner);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* ---------- masthead ---------- */}
      <header className="sticky top-0 z-50 bg-ink text-paper">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-14 flex items-center gap-3">
          <Seal className="h-8 w-8 text-paper shrink-0" />
          <div className="min-w-0 leading-none">
            <div className="font-display text-lg sm:text-xl tracking-tight truncate">
              Mr. Shakeel <span className="italic text-paper/60">License Bureau</span>
            </div>
            <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.28em] text-paper/50 uppercase mt-0.5">
              v2.5.8 · master control panel
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-paper/60">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-ok" />
              online
            </span>
            <span
              className={`font-mono text-[10px] tracking-[0.16em] uppercase px-2 py-1 border ${
                isOwner
                  ? "border-stamp text-stamp"
                  : "border-paper/30 text-paper/70"
              }`}
            >
              {isOwner ? "master owner" : "reseller"}
            </span>
            <button
              onClick={logout}
              disabled={busy}
              className="font-mono text-[10px] tracking-[0.16em] uppercase text-paper/60 hover:text-paper disabled:opacity-40"
            >
              exit
            </button>
          </div>
        </div>
        {/* torn paper edge under the masthead */}
        <div className="h-2 bg-ink" style={{
          maskImage: "radial-gradient(circle at 6px 8px, transparent 0 5px, #000 5.5px)",
          WebkitMaskImage: "radial-gradient(circle at 6px 8px, transparent 0 5px, #000 5.5px)",
          maskSize: "12px 16px",
          WebkitMaskSize: "12px 16px",
          maskRepeat: "repeat-x",
          WebkitMaskRepeat: "repeat-x",
        }} />
      </header>

      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 flex-1 flex gap-6 pb-28 sm:pb-10">
        {/* ---------- desktop rail ---------- */}
        <aside className="hidden sm:block w-[190px] shrink-0 py-6">
          <nav className="sticky top-24 flex flex-col gap-px border-l-2 border-rule">
            {items.map((n) => {
              const active =
                n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`-ml-0.5 pl-4 py-2.5 font-mono text-[11px] tracking-[0.2em] uppercase border-l-2 transition-colors ${
                    active
                      ? "border-stamp text-stamp font-semibold bg-stamp-soft/50"
                      : "border-transparent text-ink-2 hover:text-ink hover:border-rule"
                  }`}
                >
                  <span className="inline-block w-5 text-center">{n.icon}</span>{" "}
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="sticky top-[320px] mt-8 border border-rule bg-paper-2/60 p-3">
            <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink-3 mb-1.5">
              signed in as
            </div>
            <div className="font-semibold text-sm truncate">{user.name}</div>
            <div className="font-mono text-[11px] text-ink-2 truncate">
              @{user.username}
            </div>
          </div>
        </aside>

        {/* ---------- content ---------- */}
        <main className="min-w-0 flex-1 py-5 sm:py-8">{children}</main>
      </div>

      {/* ---------- mobile tab bar ---------- */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-ink text-paper border-t border-black/40">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {items.map((n) => {
            const active =
              n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`py-2.5 flex flex-col items-center gap-0.5 border-t-2 ${
                  active ? "border-stamp text-paper" : "border-transparent text-paper/45"
                }`}
              >
                <span className="text-sm leading-none">{n.icon}</span>
                <span className="font-mono text-[9px] tracking-[0.14em] uppercase">
                  {n.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
