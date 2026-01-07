"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "grid" | "film" | "poster" | "studio";

function normalizeMode(raw: string | null): Mode {
  const v = (raw ?? "").toLowerCase();
  if (v === "film") return "film";
  if (v === "poster") return "poster";
  if (v === "studio") return "studio";
  return "grid";
}

export default function MonthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const monthId = searchParams.get("month") || "2026-01";
  const mode: Mode = normalizeMode(searchParams.get("mode"));

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  function setMode(next: Mode) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("mode", next);
    if (!sp.get("month")) sp.set("month", monthId);
    router.push(`/month?${sp.toString()}`);
  }

  function openDay(day: number) {
    const sp = new URLSearchParams();
    sp.set("mode", mode);
    router.push(`/month/${monthId}/day/${day}?${sp.toString()}`);
  }

  return (
    <main style={{ minHeight: "100vh", padding: 32, background: "#0a0a0a", color: "#fff" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Month · {monthId}</h1>
          <div style={{ opacity: 0.65, fontSize: 13, marginTop: 6 }}>
            mode: <span style={{ opacity: 0.9 }}>{mode}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <ModeButton active={mode === "grid"} onClick={() => setMode("grid")}>Grid</ModeButton>
          <ModeButton active={mode === "film"} onClick={() => setMode("film")}>Film</ModeButton>
          <ModeButton active={mode === "poster"} onClick={() => setMode("poster")}>Poster</ModeButton>
          <ModeButton active={mode === "studio"} onClick={() => setMode("studio")}>Studio</ModeButton>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: mode === "poster" ? "repeat(4, 1fr)" : "repeat(7, 1fr)",
          gap: 12,
        }}
      >
        {days.map((d) => (
          <button
            key={d}
            onClick={() => openDay(d)}
            style={{
              padding: mode === "poster" ? "18px 14px" : "16px 12px",
              minHeight: mode === "poster" ? 160 : 90,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700 }}>Day {d}</div>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 6 }}>{mode}</div>
          </button>
        ))}
      </section>
    </main>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
