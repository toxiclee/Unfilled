"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { buildMonthGrid } from "../../../lib/calendar";

/* ------------------ ElegantVinyl Component ------------------ */
function ElegantVinyl({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div
      style={{
        width: "60px",
        height: "60px",
        backgroundColor: "#fcfcfc",
        border: "1px solid #eee",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s ease",
        position: "relative",
        boxShadow: isPlaying ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          border: "1px solid #333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: isPlaying ? "softRotate 5s linear infinite" : "none",
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "2px", height: "2px", backgroundColor: "#fff", borderRadius: "50%" }} />
        </div>
        <div
          style={{
            position: "absolute",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: "0.5px solid rgba(0,0,0,0.1)",
          }}
        />
      </div>

      {isPlaying && (
        <div
          style={{
            position: "absolute",
            bottom: "6px",
            fontSize: "8px",
            color: "#aaa",
            letterSpacing: "1px",
          }}
        >
          ♪ . . .
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes softRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `,
        }}
      />
    </div>
  );
}

const ChevronLeft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
  </svg>
);

const ChevronRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
  </svg>
);

/* ------------------ Types & Utils ------------------ */
type CalendarModeId = "poster" | "grid" | "film" | "instant" | "japanese";

// Monday-first
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// public/defaults/01.jpg ... 04.jpg
const DEFAULT_COVERS = ["/defaults/01.jpg", "/defaults/02.jpg", "/defaults/03.jpg", "/defaults/04.jpg"] as const;

function clampMode(mode?: string | null): CalendarModeId {
  if (mode === "grid" || mode === "film" || mode === "instant" || mode === "japanese") return mode;
  return "poster";
}

function formatYM(year: number, monthIndex0: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

function addMonths(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}

/* ------------------ Custom Hook: Cover Logic ------------------ */
function useMonthCover(ym: string) {
  const key = `unfilled:cover:${ym}`;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [coverSrc, setCoverSrc] = useState<string>(DEFAULT_COVERS[0]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setCoverSrc(saved);
    } catch {
      // ignore
    }
  }, [key]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    setCoverSrc(blobUrl);

    try {
      localStorage.setItem(key, blobUrl);
    } catch {
      // ignore quota errors
    }
  };

  return {
    coverSrc,
    fileInputRef,
    pickCover: () => fileInputRef.current?.click(),
    onFileChange,
  };
}

/* ------------------ Shared Component: Header ------------------ */
function Header({
  year,
  monthIndex0,
  ym,
  mode,
}: {
  year: number;
  monthIndex0: number;
  ym: string;
  mode: CalendarModeId;
}) {
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });
  const prev = addMonths(year, monthIndex0, -1);
  const next = addMonths(year, monthIndex0, 1);

  const btnStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 12,
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid rgba(128,128,128,0.2)",
    background: active ? "#000" : "transparent",
    color: active ? "#fff" : "inherit",
    transition: "0.2s",
  });

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: -1 }}>
          {monthName} <span style={{ fontWeight: 200, opacity: 0.5 }}>{year}</span>
        </h1>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: 8, marginRight: 8 }}>
          <Link
            href={`/month/${formatYM(prev.year, prev.monthIndex0)}?mode=${mode}`}
            aria-label="Previous month"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "inherit",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.5")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <ChevronLeft />
          </Link>

          <Link
            href={`/month/${formatYM(next.year, next.monthIndex0)}?mode=${mode}`}
            aria-label="Next month"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "inherit",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.5")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <ChevronRight />
          </Link>
        </div>

        {(["poster", "grid", "film", "instant", "japanese"] as const).map((m) => (
          <Link key={m} href={`/month/${ym}?mode=${m}`} style={btnStyle(mode === m)}>
            {m.toUpperCase()}
          </Link>
        ))}
      </div>
    </header>
  );
}

/* ------------------ Mode A: Poster Mode (STRICT 50/50, NO SCROLL, EVEN GRID) ------------------ */
function PosterMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);
  const posterCardRef = useRef<HTMLDivElement | null>(null);

  const exportPosterPDF = async (device: "desktop" | "phone" = "desktop") => {
    try {
      await (document as any).fonts?.ready;
      const node = posterCardRef.current;
      if (!node) return alert("Nothing to export");

      const deviceSizes = {
        desktop: { w: 1920, h: 1080 },
        phone: { w: 1080, h: 1920 },
      } as const;
      const target = deviceSizes[device];

      const scale = Math.max(1, target.w / Math.max(1, node.clientWidth));
      const canvas = await html2canvas(node as HTMLElement, { useCORS: true, scale });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        unit: "px",
        format: [target.w, target.h],
        orientation: target.w >= target.h ? "landscape" : "portrait",
      });
      pdf.addImage(imgData, "PNG", 0, 0, target.w, target.h);
      pdf.save(`${ym}-poster-${device}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Export failed — possible CORS issue with images. Try uploading a cover image or use the desktop browser.");
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px", color: "#000" }}>
      <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

      {/* ✅ 一张图：严格 50% / 50%，不滚动 */}
      <div
        ref={posterCardRef}
        style={{
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid #eee",
          background: "#fff",
          display: "grid",
          gridTemplateRows: "50% 50%", // ✅ 强制 50/50
          height: "min(78vh, 820px)",  // ✅ 固定高度，不出现滚动
        }}
      >
        {/* 上半：封面 */}
        <div style={{ position: "relative", cursor: "pointer" }} onClick={pickCover}>
          <img
            src={coverSrc}
            alt="Month Cover"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />

          {/* Export buttons */}
          <div
            style={{
              position: "absolute",
              bottom: 18,
              left: 18,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => exportPosterPDF("desktop")}
              style={{
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: "none",
                padding: "6px 10px",
                borderRadius: 16,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Export PDF (Desktop)
            </button>
            <button
              onClick={() => exportPosterPDF("phone")}
              style={{
                background: "rgba(0,0,0,0.35)",
                color: "#fff",
                border: "none",
                padding: "6px 10px",
                borderRadius: 16,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Export PDF (Phone)
            </button>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 18,
              right: 18,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
            }}
          >
            Change Cover
          </div>

          <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />
        </div>

        {/* 下半：日历（✅ weekday 与 days 按比例分配，days 6 行均分） */}
        <div
          style={{
            background: "#fff",
            padding: 18,
            overflow: "hidden",          // ✅ 禁止滚动
            display: "grid",
            gridTemplateRows: "1fr 6fr", // ✅ weekday:days = 1:6
            gap: 0,
          }}
        >
          {/* Weekdays row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", alignItems: "center" }}>
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 12,
                  opacity: 0.35,
                  lineHeight: 1,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid: 固定 6 行，每行等高，每格占满自己的格子 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gridTemplateRows: "repeat(6, 1fr)", // ✅ 6 行等高
              gap: 0,
              alignItems: "center",
              justifyItems: "center",
            }}
          >
            {cells.map((cell: any, i: number) =>
              cell.type === "empty" ? (
                <div key={i} />
              ) : (
                <Link
                  key={i}
                  href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: "#111",
                    fontSize: 18,
                    fontWeight: 300,
                    lineHeight: 1,
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

/* ------------------ Mode B: Grid Mode (Numbers) ------------------ */
function GridMode({ year, monthIndex0, ym, mode, cells }: any) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  const exportGridPDF = async (target: "desktop" | "phone" = "desktop") => {
    try {
      await (document as any).fonts?.ready;
      const node = gridRef.current;
      if (!node) return alert("Nothing to export");

      const deviceSizes = {
        desktop: { w: 1920, h: 1080 },
        phone: { w: 1080, h: 1920 },
      } as const;

      const t = deviceSizes[target];
      const scale = Math.max(1, t.w / Math.max(1, node.clientWidth));
      const canvas = await html2canvas(node as HTMLElement, { useCORS: true, scale });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        unit: "px",
        format: [t.w, t.h],
        orientation: t.w >= t.h ? "landscape" : "portrait",
      });
      pdf.addImage(imgData, "PNG", 0, 0, t.w, t.h);
      pdf.save(`${ym}-grid-${target}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Export failed — possible CORS issue with images. Try the desktop browser.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 40 }}>
      <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
        <button
          onClick={() => exportGridPDF("desktop")}
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "6px 10px",
            borderRadius: 16,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Export PDF (Desktop)
        </button>
        <button
          onClick={() => exportGridPDF("phone")}
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.04)",
            padding: "6px 10px",
            borderRadius: 16,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Export PDF (Phone)
        </button>
      </div>

      {/* ✅ 数字网格 */}
      <div
        ref={gridRef}
        style={{
          marginTop: 40,
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: 18,
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto",
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        {cells.map((cell: any, i: number) =>
          cell.type === "empty" ? (
            <div key={i} />
          ) : (
            <Link
              key={i}
              href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 300,
                  letterSpacing: 0.5,
                  background: "rgba(255,255,255,0.02)",
                  transition: "transform 0.15s, opacity 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.opacity = "0.9";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px)";
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
              >
                {cell.day}
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}


/* ------------------ Mode C: Film Mode (PURE IMAGE BG + CLEAR WHITE TYPE) ------------------ */
function FilmMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);
  const monthName = new Date(year, monthIndex0, 1)
    .toLocaleString("en-US", { month: "long" })
    .toLowerCase();

  // ✅ 关键：白字 + 强阴影（不算遮罩/玻璃）
  const textShadow = "0 2px 24px rgba(0,0,0,0.95)";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${coverSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        color: "#fff",
      }}
    >
      {/* 顶部 Header：直接叠在图上，靠 textShadow 保证可读 */}
      <div style={{ position: "relative", padding: 24, color: "#fff", textShadow }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

          {/* ✅ film 下给 tab 一点点描边（仍然不是玻璃/遮罩，只是边框） */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Replace button（实体按钮，不是玻璃，不 blur） */}
      <button
        onClick={pickCover}
        style={{
          position: "absolute",
          top: 110,
          right: 28,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.18)",
          color: "rgba(0,0,0,0.85)",
          padding: "8px 12px",
          borderRadius: 999,
          cursor: "pointer",
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          transition: "opacity 0.2s",
          zIndex: 5,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Replace Film
      </button>
      <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />

      {/* 文字/日历叠在图上（无任何背景层） */}
      <div
        style={{
          position: "relative",
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 24px 24px 24px",
          height: "calc(100vh - 120px)",
          display: "flex",
          alignItems: "flex-end",
          color: "#fff",
          textShadow,
        }}
      >
        <div style={{ width: "100%" }}>
          {/* Title row */}
          <div
            style={{
              fontFamily: '"Times New Roman", serif',
              paddingBottom: "clamp(10px, 1.5vw, 18px)",
              marginBottom: "clamp(14px, 2vw, 26px)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: "clamp(44px, 6vw, 92px)",
                fontWeight: 200,
                lineHeight: 0.9,
                letterSpacing: -1,
              }}
            >
              {monthName}
            </div>

            <div
              style={{
                fontSize: "clamp(16px, 1.8vw, 28px)",
                fontWeight: 300,
                opacity: 0.9,
                letterSpacing: 2,
              }}
            >
              {year}
            </div>
          </div>

          {/* Weekdays */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              alignItems: "center",
              marginBottom: "clamp(8px, 1vw, 12px)",
            }}
          >
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                style={{
                  fontSize: "clamp(9px, 1vw, 12px)",
                  opacity: 0.9,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "clamp(10px, 1.2vw, 18px) 0px",
              textAlign: "center",
              alignItems: "center",
            }}
          >
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
                    fontSize: "clamp(14px, 1.7vw, 22px)",
                    fontWeight: 600,
                    height: "clamp(34px, 3.4vw, 52px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 999,
                    transition: "opacity 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.65";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(0px)";
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

/* ------------------ Mode D: Instant Mode (Polaroid Style) ------------------ */
function InstantMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#e8e8e8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
      }}
    >
      <div style={{ marginBottom: 40, width: "100%", maxWidth: 800 }}>
        <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />
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
          <Image src={coverSrc} alt="Instant photo" fill style={{ objectFit: "cover", filter: "sepia(10%) contrast(105%)" }} priority />
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

/* ------------------ Mode E: Japanese Mode (simple clean v1) ------------------ */
/* ------------------ Mode E: Japanese Mode (Washi + Grain) ------------------ */
function JapaneseMode({ year, monthIndex0, ym, mode, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } = useMonthCover(ym);
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });

  return (
    <div
      style={{
        minHeight: "100vh",
        // ✅ 和纸底：很淡的纸纹 + 温暖底色
        backgroundColor: "#f7f4ee",
        backgroundImage: `
          repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0px, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 6px),
          repeating-linear-gradient(90deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 9px),
          radial-gradient(1200px 800px at 20% 10%, rgba(255, 214, 170, 0.18) 0%, transparent 55%),
          radial-gradient(900px 700px at 85% 20%, rgba(170, 210, 255, 0.14) 0%, transparent 55%)
        `,
        color: "#1c1c1c",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

        {/* 主卡片 */}
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(255,255,255,0.65)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
            position: "relative",
          }}
        >
          {/* ✅ 细噪点 grain（全卡片） */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: 0.22,
              backgroundImage: `
                radial-gradient(rgba(0,0,0,0.22) 1px, transparent 1px),
                radial-gradient(rgba(0,0,0,0.14) 1px, transparent 1px)
              `,
              backgroundSize: "18px 18px, 26px 26px",
              backgroundPosition: "0 0, 10px 14px",
              mixBlendMode: "multiply",
            }}
          />

          {/* 上半：图 */}
          <div
            style={{
              position: "relative",
              height: 300,
              cursor: "pointer",
              background: "#eee",
            }}
            onClick={pickCover}
          >
            <Image src={coverSrc} alt="Japanese cover" fill style={{ objectFit: "cover" }} priority />

            {/* ✅ “水彩雾化”氛围（很淡） */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: `
                  radial-gradient(900px 240px at 15% 90%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 60%),
                  radial-gradient(900px 260px at 85% 95%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 60%)
                `,
              }}
            />

            {/* 标题小角标（像日记） */}
            <div
              style={{
                position: "absolute",
                left: 22,
                bottom: 18,
                color: "rgba(0,0,0,0.75)",
                fontFamily: '"Times New Roman", serif',
              }}
            >
              <div style={{ fontSize: 18, letterSpacing: 0.2 }}>
                {monthName} {year}
              </div>
              <div style={{ fontSize: 12, opacity: 0.55 }}>a small diary of ordinary days</div>
            </div>

            {/* Change 按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                pickCover();
              }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(0,0,0,0.12)",
                color: "rgba(0,0,0,0.7)",
                padding: "8px 12px",
                borderRadius: 999,
                cursor: "pointer",
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Change
            </button>

            <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />
          </div>

          {/* 下半：日历（保留你现在那种圆角格子，但更“日系纸感”） */}
          <div style={{ padding: 22, background: "rgba(255,255,255,0.55)" }}>
            {/* weekdays */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                fontSize: 11,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.35)",
                marginBottom: 14,
              }}
            >
              {WEEKDAYS.map((d) => (
                <div key={d} style={{ textAlign: "center" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* days */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
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
                    }}
                  >
                    <div
                      style={{
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.75)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
                        transition: "transform 0.12s ease, background 0.12s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.92)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0px)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.75)";
                      }}
                    >
                      {cell.day}
                    </div>
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

/* ------------------ Main Client Component ------------------ */
export default function MonthClient({ monthId }: { monthId: string }) {
  const searchParams = useSearchParams();
  const mode = clampMode(searchParams.get("mode"));

  const { year, monthIndex0 } = useMemo(() => {
    const [y, m] = (monthId || "").split("-");
    return {
      year: Number.parseInt(y || "2026", 10) || 2026,
      monthIndex0: (Number.parseInt(m || "1", 10) || 1) - 1,
    };
  }, [monthId]);

  const { cells } = buildMonthGrid(year, monthIndex0);

  if (mode === "grid") return <GridMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
  if (mode === "film") return <FilmMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
  if (mode === "instant") return <InstantMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
  if (mode === "japanese") return <JapaneseMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
  return <PosterMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
}
