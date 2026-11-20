"use client";

import { useState } from "react";

export function CopyBlock({
  title,
  code,
  lang = "",
  maxHeight = 460,
}: {
  title: string;
  code: string;
  lang?: string;
  maxHeight?: number;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(maxHeight > 300 ? false : true);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function download() {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/[^\w.-]+/g, "_") || "file.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="border border-ink bg-[#16130e] text-[#e9e2d4]">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/55 truncate">
          {lang && <span className="text-stamp-soft mr-2">{lang}</span>}
          {title}
        </span>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setOpen((o) => !o)}
            className="font-mono text-[9.5px] uppercase tracking-wider border border-white/25 px-2 py-1 hover:border-white/60"
          >
            {open ? "collapse" : "expand"}
          </button>
          <button
            onClick={copy}
            className="font-mono text-[9.5px] uppercase tracking-wider border border-white/25 px-2 py-1 hover:border-white/60"
          >
            {copied ? "copied ✓" : "copy"}
          </button>
          <button
            onClick={download}
            className="font-mono text-[9.5px] uppercase tracking-wider bg-stamp px-2 py-1 hover:bg-[#a72c18]"
          >
            save
          </button>
        </div>
      </div>
      {open && (
        <pre
          className="overflow-auto p-3 font-mono text-[11.5px] leading-[1.55] whitespace-pre"
          style={{ maxHeight }}
        >
          {code}
        </pre>
      )}
    </div>
  );
}
