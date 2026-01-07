"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { buildMonthGrid } from "../../lib/calendar";

/* ------------------ Types & Utils ------------------ */
type CalendarModeId = "grid" | "film" | "poster" | "instant";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function clampMode(mode?: string | null): CalendarModeId {
  if (mode === "grid" || mode === "film" || mode === "poster" || mode === "instant") return mode;
  return "grid";
}

function clampYM(ym?: string | null) {
  if (ym && /^\d{4}-\d{2}$/.test(ym)) return ym;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatYM(year: number, monthIndex0: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

function addMonths(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}

/* ------------------ Blob + LocalStorage (store URL only) ------------------ */
function useMonthCover(ym: string) {
  const key = `unfilled:cover:${ym}`;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [coverSrc, setCoverSrc] = useState<string>("/covers/default.jpg");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setCoverSrc(saved);
    } catch {
      // ignore
    }
  }, [key]);

  const pickCover = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const pathname = `covers/${ym}/${Date.now()}-${file.name}`;
      const res = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/uploads",
      });

      setCoverSrc(res.url);

      // Store ONLY URL
      try {
        localStorage.setItem(key, res.url);
      } catch {
        // ignore
      }
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return { coverSrc, uploading, error, fileInputRef, pickCover, onFileChange };
}

/* ------------------ Export PDF ------------------ */
async function exportMonthPdf(month: string, mode: string) {
  const url = `/api/export/month?month=${encodeURIComponent(month)}&mode=${encodeURIComponent(mode)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(text || `Export failed (${resp.status})`);
  }
  const blob = await resp.blob();
  const a = document.createElement("a");
  const blobUrl = URL.createObjectURL(blob);
  a.href = blobUrl;
  a.download = `unfilled-${month}-${mode}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

/* ------------------ Shared Header ------------------ */
function Header({
  year,
  monthIndex0,
  ym,
  mode,
  onChangeMonth,
  onChangeMode,
  onExport,
  exporting,
}: {
  year: number;
  monthIndex0: number;
  ym: string;
  mode: CalendarModeId;
  onChangeMonth: (ym: string) => void;
  onChangeMode: (mode: CalendarModeId) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });
  const prev = addMonths(year, monthIndex0, -1);
  const next = addMonths(year, monthIndex0, 1);

  const chip = (active: boolean): React.CSSProperties => ({
    fontSize: 12,
    textDecoration: "none",
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: active ? "rgba(255,255,255,0.12)" : "transparent",
    color: "#fff",
    cursor: "pointer",
    userSelect: "none",
  });

  const btn = (): React.CSSProperties => ({
    fontSize: 12,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#fff",
    cursor: exporting ? "not-allowed" : "pointer",
    opacity: exporting ? 0.6 : 1,
  });

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
      <div>
        <div style={{ fontSize: 34, letterSpacing: -1.2, color: "#fff" }}>
          Month · <span style={{ opacity: 0.7 }}>{ym}</span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6, color: "#fff" }}>
          {monthName} {year} · mode: {mode}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button style={btn()} onClick={() => onChangeMonth(formatYM(prev.year, prev.monthIndex0))}>
          Prev
        </button>
        <button style={btn()} onClick={() => onChangeMonth(formatYM(next.year, next.monthIndex0))}>
          Next
        </button>

        <div style={{ width: 8 }} />

        {(["grid", "film", "poster", "instant"] as const).map((m) => (
          <span key={m} style={chip(mode === m)} onClick={() => onChangeMode(m)}>
            {m === "instant" ? "Instant" : m[0].toUpperCase() + m.slice(1)}
          </span>
        ))}

        <div style={{ width: 8 }} />

        <button style={btn()} onClick={onExport} disabled={exporting}>
          {exporting ? "Exporting..." : "Export PDF"}
        </button>
      </div>
    </div>
  );
}

/* ------------------ Mode: Grid (Adobe-like white sheet) ------------------ */
function GridMode({
  year,
  monthIndex0,
  ym,
  mode,
  cells,
}: {
  year: number;
  monthIndex0: number;
  ym: string;
  mode: CalendarModeId;
  cells: any[];
}) {
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" }).toUpperCase();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#efefef",
        display: "flex",
        justifyContent: "center",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          width: "min(1100px, 100%)",
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 16px 60px rgba(0,0,0,0.12)",
          padding: "40px 40px 28px 40px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{monthName}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{year}</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            borderTop: "1px solid #d9d9d9",
            borderLeft: "1px solid #d9d9d9",
          }}
        >
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              style={{
                padding: "10px 12px",
                borderRight: "1px solid #d9d9d9",
                borderBottom: "1px solid #d9d9d9",
                fontSize: 12,
                fontWeight: 700,
                color: "#333",
              }}
            >
              {d}
            </div>
          ))}

          {cells.map((cell: any, i: number) => {
            const isEmpty = cell.type === "empty";
            return (
              <div
                key={i}
                style={{
                  minHeight: 92,
                  padding: 10,
                  borderRight: "1px solid #d9d9d9",
                  borderBottom: "1px solid #d9d9d9",
                  color: "#111",
                }}
              >
                {isEmpty ? null : (
                  <Link
                    href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                    style={{
                      textDecoration: "none",
                      color: "#111",
                      fontSize: 16,
                      fontWeight: 700,
                    }}
                  >
                    {cell.day}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>{ym}</div>
      </div>
    </div>
  );
}

/* ------------------ Mode: Poster (simple cover + mini calendar) ------------------ */
function PosterMode({
  year,
  monthIndex0,
  ym,
  mode,
  cells,
}: {
  year: number;
  monthIndex0: number;
  ym: string;
  mode: CalendarModeId;
  cells: any[];
}) {
  const { coverSrc, uploading, error, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <div style={{ position: "relative", height: 420, cursor: "pointer" }} onClick={pickCover}>
            <Image src={coverSrc} alt="Month cover" fill style={{ objectFit: "cover" }} priority />
            <div
              style={{
                position: "absolute",
                bottom: 16,
                right: 16,
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                fontSize: 12,
                backdropFilter: "blur(10px)",
              }}
            >
              {uploading ? "Uploading..." : "Change Cover"}
            </div>

            {error ? (
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: "rgba(180,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  fontSize: 12,
                  backdropFilter: "blur(10px)",
                }}
              >
                {error}
              </div>
            ) : null}

            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={onFileChange} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: 20 }}>
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 12, opacity: 0.35, marginBottom: 10 }}>
                {d}
              </div>
            ))}
            {cells.map((cell: any, i: number) =>
              cell.type === "empty" ? (
                <div key={i} />
              ) : (
                <Link
                  key={i}
                  href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                  style={{
                    height: 60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 300,
                    opacity: 0.9,
                  }}
                >
                  {cell.day}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Mode: Film (Beautified - your version) ------------------ */
function FilmMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);

  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" }).toLowerCase();
  const yearNum = year;

  const pillBase: React.CSSProperties = {
    position: "absolute",
    top: 20,
    right: 20,
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.7)",
    padding: "8px 12px",
    borderRadius: 30,
    cursor: "pointer",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    transition: "all 0.3s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{ width: "min(700px, 100%)", position: "relative" }}>
        {/* 顶部 Header：淡显示（不强行 top:-50，避免小屏裁切） */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, opacity: 0.55 }}>
          <div style={{ transform: "scale(0.92)" }}>
            <Header
              year={year}
              monthIndex0={monthIndex0}
              ym={ym}
              mode={mode}
              onChangeMonth={() => {}}
              onChangeMode={() => {}}
              onExport={() => {}}
              exporting={false}
            />
          </div>
        </div>

        <div
          style={{
            position: "relative",
            aspectRatio: "4/5",
            borderRadius: "4px",
            overflow: "hidden",
            boxShadow: "0 50px 120px -20px rgba(0,0,0,0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Image
            src={coverSrc}
            alt="Film"
            fill
            style={{ objectFit: "cover", filter: "grayscale(20%) contrast(110%)" }}
            priority
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0.6) 40%, transparent 80%)",
            }}
          />

          <button
            onClick={pickCover}
            style={pillBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.3)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
          >
            Replace Film
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />

          <div style={{ position: "absolute", bottom: 50, left: 50, right: 50, color: "#fff" }}>
            <div
              style={{
                fontFamily: '"Times New Roman", serif',
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: 20,
                marginBottom: 30,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div style={{ fontSize: 80, fontWeight: 100, lineHeight: 0.8, letterSpacing: -2 }}>{monthName}</div>
              <div style={{ fontSize: 24, fontWeight: 300, opacity: 0.6, letterSpacing: 2 }}>{yearNum}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "15px 0", textAlign: "center" }}>
              {WEEKDAYS.map((d) => (
                <div key={d} style={{ fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2 }}>
                  {d}
                </div>
              ))}

              {cells.map((cell: any, idx: number) =>
                cell.type === "empty" ? (
                  <div key={idx} />
                ) : (
                  <Link
                    key={idx}
                    href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                    style={{
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: 18,
                      fontWeight: 300,
                      opacity: 0.8,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.opacity = "0.8";
                    }}
                  >
                    {cell.day}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Mode: Instant (Polaroid Style - your version) ------------------ */
function InstantMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#e8e8e8",
        backgroundImage: "radial-gradient(#d1d1d1 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
      }}
    >
      <div style={{ marginBottom: 40, width: "100%", maxWidth: 800 }}>
        <div style={{ background: "#111", borderRadius: 14, padding: 16, color: "#fff" }}>
          {/* 这里为了保持你原来 Header（按钮/导出）能用，我们不隐藏它 */}
          {/* Header 在 MonthClient 里渲染；这个模式里不要重复 */}
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "20px 20px 40px 20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.12), 0 5px 15px rgba(0,0,0,0.05)",
          borderRadius: "2px",
          width: "min(500px, 100%)",
          transform: "rotate(-1.5deg)",
          transition: "transform 0.3s ease",
        }}
      >
        <div
          onClick={pickCover}
          style={{
            position: "relative",
            aspectRatio: "1/1",
            background: "#eee",
            overflow: "hidden",
            cursor: "pointer",
            marginBottom: 30,
            boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
          }}
        >
          <Image src={coverSrc} alt="Instant photo" fill style={{ objectFit: "cover", filter: "sepia(10%) contrast(105%)" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
              pointerEvents: "none",
            }}
          />
        </div>

        <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />

        <div style={{ textAlign: "center", color: "#222" }}>
          <h2
            style={{
              fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
              fontSize: 48,
              margin: "0 0 20px 0",
              fontWeight: 400,
              opacity: 0.8,
            }}
          >
            {monthName} {year}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px 5px",
              maxWidth: 350,
              margin: "0 auto",
              fontFamily: "monospace",
              fontSize: 13,
            }}
          >
            {WEEKDAYS.map((d) => (
              <div key={d} style={{ opacity: 0.3, fontSize: 10 }}>
                {d[0]}
              </div>
            ))}
            {cells.map((cell: any, idx: number) =>
              cell.type === "empty" ? (
                <div key={idx} />
              ) : (
                <Link
                  key={idx}
                  href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    padding: "2px",
                    borderRadius: "4px",
                    transition: "background 0.2s",
                    display: "block",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {cell.day}
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, fontSize: 12, color: "#888", fontStyle: "italic" }}>* Click the photo to replace memory.</div>
    </div>
  );
}

/* ------------------ Main Client Component ------------------ */
export default function MonthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const ym = clampYM(searchParams.get("month"));
  const mode = clampMode(searchParams.get("mode"));

  const { year, monthIndex0 } = useMemo(() => {
    const [y, m] = ym.split("-");
    const yy = Number.parseInt(y, 10);
    const mm = Number.parseInt(m, 10);
    return { year: Number.isFinite(yy) ? yy : 2026, monthIndex0: Number.isFinite(mm) ? mm - 1 : 0 };
  }, [ym]);

  const { cells } = buildMonthGrid(year, monthIndex0);

  const [exporting, setExporting] = useState(false);

  const onChangeMonth = (newYm: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("month", newYm);
    sp.set("mode", mode);
    router.push(`/month?${sp.toString()}`);
  };

  const onChangeMode = (newMode: CalendarModeId) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("month", ym);
    sp.set("mode", newMode);
    router.push(`/month?${sp.toString()}`);
  };

  const onExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportMonthPdf(ym, mode);
    } catch (e: any) {
      alert(e?.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  // 注意：Instant/Film 里不重复渲染 Header（否则两个导航）
  // 所以我们统一在最上方渲染一次 Header + 模式内容
  return (
    <div style={{ minHeight: "100vh", background: mode === "grid" ? "#efefef" : mode === "instant" ? "#e8e8e8" : "#0a0a0a" }}>
      <div style={{ padding: 28, background: "#0a0a0a" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Header
            year={year}
            monthIndex0={monthIndex0}
            ym={ym}
            mode={mode}
            onChangeMonth={onChangeMonth}
            onChangeMode={onChangeMode}
            onExport={onExport}
            exporting={exporting}
          />
        </div>
      </div>

      {mode === "grid" ? <GridMode year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} cells={cells} /> : null}
      {mode === "poster" ? <PosterMode year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} cells={cells} /> : null}
      {mode === "film" ? <FilmMode year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} cells={cells} /> : null}
      {mode === "instant" ? <InstantMode year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} cells={cells} /> : null}
    </div>
  );
}
