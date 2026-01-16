"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { buildMonthGrid } from "../../../lib/calendar";
import { MODE_CONCEPTUAL_LABELS, ORDERED_MODES } from "../../../lib/calendarModes";

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

/* ------------------ Mode Intro Overlay ------------------ */
function ModeIntroOverlay({ onClose }: { onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 300ms ease-out",
      }}
    >
      <div
        ref={overlayRef}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "32px 40px",
          maxWidth: 420,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          position: "relative",
          animation: "slideUp 300ms ease-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            fontSize: 20,
            color: "rgba(0,0,0,0.4)",
            cursor: "pointer",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(0,0,0,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,0,0,0.4)")}
        >
          ×
        </button>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: 14,
            fontWeight: 300,
            letterSpacing: "0.08em",
            color: "rgba(0,0,0,0.6)",
            fontVariant: "small-caps",
          }}
        >
          Not Yet · Still · Warm · Quiet · Lingering
        </h3>

        {/* Body */}
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: 16,
            lineHeight: 1.6,
            color: "rgba(0,0,0,0.75)",
            fontWeight: 300,
          }}
        >
          These aren't views.
          <br />
          They're ways of sensing time.
          <br />
          Move freely between them.
        </p>

        {/* CTA */}
        <button
          onClick={onClose}
          style={{
            background: "#000",
            color: "#fff",
            border: "none",
            padding: "8px 24px",
            borderRadius: 20,
            cursor: "pointer",
            fontSize: 13,
            letterSpacing: 0.5,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Okay
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
}

/* ------------------ Gesture Sketch Component ------------------ */
function GestureSketch({ mode }: { mode: CalendarModeId }) {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  // Abstract gesture sketches per mode - minimal linework only
  const sketches: Record<CalendarModeId, { paths: string[]; strokeWidth?: number }> = {
    poster: {
      // Not Yet: open arc, incomplete gesture
      paths: ["M4,20 Q12,8 20,16"],
    },
    grid: {
      // Still: minimal, stable lines
      paths: ["M8,8 L24,8", "M8,16 L24,16"],
    },
    film: {
      // Warm: slightly denser/thicker, flowing
      paths: ["M6,12 Q10,6 14,12 Q18,18 22,12", "M8,20 Q16,16 24,20"],
      strokeWidth: 1.2,
    },
    instant: {
      // Quiet: sparse, light presence
      paths: ["M16,6 L16,26"],
    },
    japanese: {
      // Lingering: longer trailing stroke
      paths: ["M4,16 Q8,10 12,14 Q16,18 20,14 Q24,10 28,14"],
    },
  };

  const currentSketch = sketches[mode];
  const isDarkMode = mode === "grid" || mode === "film";
  const strokeColor = isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  useEffect(() => {
    // Reset and trigger animation on mode change
    setIsVisible(false);
    setAnimationKey((prev) => prev + 1);

    const delayTimer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [mode]);

  useEffect(() => {
    if (!isVisible) return;

    // Calculate path lengths and set up stroke-dash animation
    pathRefs.current.forEach((pathEl) => {
      if (!pathEl) return;
      const length = pathEl.getTotalLength();
      pathEl.style.strokeDasharray = `${length}`;
      pathEl.style.strokeDashoffset = `${length}`;
      
      // Trigger animation
      requestAnimationFrame(() => {
        pathEl.style.transition = "stroke-dashoffset 900ms cubic-bezier(0.4, 0, 0.2, 1)";
        pathEl.style.strokeDashoffset = "0";
      });
    });
  }, [isVisible, animationKey]);

  return (
    <svg
      key={animationKey}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 400ms ease-out",
        flexShrink: 0,
      }}
    >
      {currentSketch.paths.map((pathData, index) => (
        <path
          key={index}
          ref={(el) => {
            pathRefs.current[index] = el;
          }}
          d={pathData}
          stroke={strokeColor}
          strokeWidth={currentSketch.strokeWidth || 1}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/* ------------------ Temporal Mode Indicator ------------------ */
function ModeIndicator({ currentMode, ym }: { currentMode: CalendarModeId; ym: string }) {
  const [showInfo, setShowInfo] = useState(false);

  // Adapt colors for dark modes
  const isDarkMode = currentMode === "grid" || currentMode === "film";
  const activeColor = isDarkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)";
  const inactiveColor = isDarkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.32)";

  return (
    <>
      {showInfo && <ModeIntroOverlay onClose={() => setShowInfo(false)} />}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            letterSpacing: "0.08em",
            fontWeight: 300,
            fontVariant: "small-caps",
          }}
        >
          {ORDERED_MODES.map((mode, index) => (
            <React.Fragment key={mode}>
              <Link
                href={`/month/${ym}?mode=${mode}`}
                style={{
                  textDecoration: "none",
                  color: currentMode === mode ? activeColor : inactiveColor,
                  fontWeight: currentMode === mode ? 400 : 300,
                  cursor: "pointer",
                  transition: "color 300ms ease, opacity 200ms ease",
                }}
                onMouseEnter={(e) => {
                  if (currentMode !== mode) {
                    e.currentTarget.style.opacity = "0.65";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {MODE_CONCEPTUAL_LABELS[mode]}
              </Link>
              {index < ORDERED_MODES.length - 1 && (
                <span style={{ color: inactiveColor, opacity: 0.4, userSelect: "none" }}>·</span>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <GestureSketch mode={currentMode} />

        {/* Info icon */}
        <button
          onClick={() => setShowInfo(true)}
          style={{
            background: "transparent",
            border: "none",
            color: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
            cursor: "pointer",
            fontSize: 11,
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "color 0.2s, background 0.2s",
            fontFamily: "serif",
            fontStyle: "italic",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";
            e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)";
            e.currentTarget.style.background = "transparent";
          }}
          title="About these modes"
        >
          i
        </button>
      </div>
    </>
  );
}

/* ------------------ Mode-Specific Wrapper: Applies Temporal Atmosphere ------------------ */
function ModeWrapper({ 
  mode, 
  children 
}: { 
  mode: CalendarModeId; 
  children: React.ReactNode;
}) {
  // Subtle transition durations reflecting each mode's temporal character
  const transitions: Record<CalendarModeId, string> = {
    poster: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)", // open, responsive
    grid: "all 0.25s ease-in-out", // stable, direct
    film: "all 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)", // softer, flowing
    instant: "all 0.3s ease-out", // quick settle, calm
    japanese: "all 0.6s cubic-bezier(0.33, 1, 0.68, 1)", // generous, lingering
  };

  return (
    <div
      style={{
        transition: transitions[mode],
        animation: `modeAppear 0.6s ${mode === "japanese" ? "cubic-bezier(0.33, 1, 0.68, 1)" : "ease-out"}`,
      }}
    >
      {children}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes modeAppear {
            from { 
              opacity: 0;
              transform: translateY(8px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
}

/* ------------------ Shared Export Buttons ------------------ */
function ExportButtons({ 
  onExport, 
  mode,
  containerRef 
}: { 
  onExport: (device: "desktop" | "phone") => void;
  mode: CalendarModeId;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const isDarkMode = mode === "grid" || mode === "film";
  
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 100,
      }}
    >
      <button
        onClick={() => onExport("desktop")}
        style={{
          background: isDarkMode ? "#2a2a2a" : "#fff",
          color: isDarkMode ? "#ddd" : "#666",
          border: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
          padding: "8px 14px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)";
        }}
      >
        Desktop
      </button>
      <button
        onClick={() => onExport("phone")}
        style={{
          background: isDarkMode ? "#444" : "#333",
          color: "#fff",
          border: `1px solid ${isDarkMode ? "#555" : "#333"}`,
          padding: "8px 14px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
        }}
      >
        Phone
      </button>
    </div>
  );
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

  // Adapt color for dark modes
  const isDarkMode = mode === "grid" || mode === "film";
  const textColor = isDarkMode ? "#fff" : "inherit";

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        marginBottom: 20,
        color: textColor,
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
              color: textColor,
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
              color: textColor,
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.5")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <ChevronRight />
          </Link>
        </div>

        <ModeIndicator currentMode={mode} ym={ym} />
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
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px", color: "#000", position: "relative" }}>
      <ExportButtons onExport={exportPosterPDF} mode={mode} containerRef={posterCardRef} />
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

          {/* Change Cover button */}
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
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 40, position: "relative" }}>
      <ExportButtons onExport={exportGridPDF} mode={mode} containerRef={gridRef} />
      <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

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
  const filmRef = useRef<HTMLDivElement | null>(null);
  const monthName = new Date(year, monthIndex0, 1)
    .toLocaleString("en-US", { month: "long" })
    .toLowerCase();

  // ✅ 关键：白字 + 强阴影（不算遮罩/玻璃）
  const textShadow = "0 2px 24px rgba(0,0,0,0.95)";

  const exportFilmPDF = async (device: "desktop" | "phone" = "desktop") => {
    try {
      await (document as any).fonts?.ready;
      const node = filmRef.current;
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
      pdf.save(`${ym}-film-${device}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Export failed — possible CORS issue with images. Try uploading a cover image or use the desktop browser.");
    }
  };

  return (
    <div
      ref={filmRef}
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
      <ExportButtons onExport={exportFilmPDF} mode={mode} containerRef={filmRef} />
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
  const instantRef = useRef<HTMLDivElement | null>(null);
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });

  const exportInstantPDF = async (device: "desktop" | "phone" = "desktop") => {
    try {
      await (document as any).fonts?.ready;
      const node = instantRef.current;
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
      pdf.save(`${ym}-instant-${device}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Export failed — possible CORS issue with images. Try the desktop browser.");
    }
  };

  return (
    <div
      ref={instantRef}
      style={{
        minHeight: "100vh",
        background: "#e8e8e8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 20px",
        position: "relative",
      }}
    >
      <ExportButtons onExport={exportInstantPDF} mode={mode} containerRef={instantRef} />
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
  const japaneseRef = useRef<HTMLDivElement | null>(null);
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", { month: "long" });

  const exportJapanesePDF = async (device: "desktop" | "phone" = "desktop") => {
    try {
      await (document as any).fonts?.ready;
      const node = japaneseRef.current;
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
      pdf.save(`${ym}-japanese-${device}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Export failed — possible CORS issue with images. Try the desktop browser.");
    }
  };

  return (
    <div
      ref={japaneseRef}
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
        position: "relative",
      }}
    >
      <ExportButtons onExport={exportJapanesePDF} mode={mode} containerRef={japaneseRef} />
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
  const [showIntro, setShowIntro] = useState(false);

  const { year, monthIndex0 } = useMemo(() => {
    const [y, m] = (monthId || "").split("-");
    return {
      year: Number.parseInt(y || "2026", 10) || 2026,
      monthIndex0: (Number.parseInt(m || "1", 10) || 1) - 1,
    };
  }, [monthId]);

  const { cells } = buildMonthGrid(year, monthIndex0);

  // One-time intro overlay logic
  useEffect(() => {
    try {
      const seen = localStorage.getItem("unfilled_mode_intro_seen");
      if (!seen) {
        // Small delay before showing to avoid jarring experience
        const timer = setTimeout(() => {
          setShowIntro(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleCloseIntro = () => {
    setShowIntro(false);
    try {
      localStorage.setItem("unfilled_mode_intro_seen", "true");
    } catch {
      // localStorage not available
    }
  };

  // Wrap each mode with temporal transitions
  const renderMode = () => {
    if (mode === "grid") return <GridMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
    if (mode === "film") return <FilmMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
    if (mode === "instant") return <InstantMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
    if (mode === "japanese") return <JapaneseMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
    return <PosterMode year={year} monthIndex0={monthIndex0} ym={monthId} mode={mode} cells={cells} />;
  };

  return (
    <>
      {showIntro && <ModeIntroOverlay onClose={handleCloseIntro} />}
      <ModeWrapper mode={mode}>{renderMode()}</ModeWrapper>
    </>
  );
}
