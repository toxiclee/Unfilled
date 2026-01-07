"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Mode = "poster" | "film" | "instant";

type DayCell = {
  day: number;
  image?: string | null;
};

const LS_KEY_PREFIX = "unfilled:month:";

// ✅ 你要的一套默认图：放在 /public/defaults 下面
// 你可以先用这些文件名占位，后面换成你自己的摄影作品也行
const DEFAULT_IMAGES: string[] = [
  "/defaults/01.jpg",
  "/defaults/02.jpg",
  "/defaults/03.jpg",
  "/defaults/04.jpg",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function safeRead(key: string): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ❗不要 throw：quota 满了也不能把 UI 炸掉
  }
}

function getDefaultImageForDay(ym: string, day: number) {
  // 稳定映射：同一个 month/day 永远拿同一张默认图
  // 这样你发给摄影师看不会“每次刷新乱跳”
  const seed = `${ym}-${day}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return DEFAULT_IMAGES[hash % DEFAULT_IMAGES.length];
}

function useMonthState(ym: string) {
  const key = `${LS_KEY_PREFIX}${ym}`;

  const [cells, setCells] = useState<DayCell[]>(() =>
    Array.from({ length: 31 }, (_, i) => ({ day: i + 1, image: null }))
  );

  useEffect(() => {
    const saved = safeRead(key);
    if (saved?.cells && Array.isArray(saved.cells)) {
      // merge by day
      const map = new Map<number, DayCell>();
      for (const c of saved.cells) {
        if (typeof c?.day === "number") map.set(c.day, { day: c.day, image: c.image ?? null });
      }
      setCells((prev) => prev.map((p) => map.get(p.day) ?? p));
    }
  }, [key]);

  useEffect(() => {
    safeWrite(key, { cells });
  }, [key, cells]);

  const setDayImage = (day: number, image: string | null) => {
    setCells((prev) => prev.map((c) => (c.day === day ? { ...c, image } : c)));
  };

  return { cells, setDayImage };
}

function ModePill({
  label,
  active,
  onClick,
}: {
  label: Mode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        padding: "8px 14px",
        border: active ? "1px solid #111" : "1px solid rgba(0,0,0,0.18)",
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        cursor: "pointer",
        fontSize: 13,
        lineHeight: "13px",
      }}
    >
      {label}
    </button>
  );
}

function TopBar({
  ym,
  mode,
  setMode,
  onExport,
}: {
  ym: string;
  mode: Mode;
  setMode: (m: Mode) => void;
  onExport: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
      }}
    >
      <div style={{ fontSize: 16, color: "#111" }}>{ym}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* ✅ 不要 Link，这里只 setState，避免 404 */}
        <ModePill label="poster" active={mode === "poster"} onClick={() => setMode("poster")} />
        <ModePill label="film" active={mode === "film"} onClick={() => setMode("film")} />
        <ModePill label="instant" active={mode === "instant"} onClick={() => setMode("instant")} />

        <button
          type="button"
          onClick={onExport}
          style={{
            marginLeft: 8,
            border: "none",
            background: "transparent",
            fontSize: 14,
            cursor: "pointer",
            color: "#111",
          }}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}

/** ------------------ Mode A: Poster (clean wall) ------------------ */
function PosterMode({
  ym,
  cells,
}: {
  ym: string;
  cells: DayCell[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 12,
      }}
    >
      {cells.map((c) => {
        const src = c.image ?? getDefaultImageForDay(ym, c.day);
        const href = `/month/${ym}/day/${c.day}?mode=poster`;

        return (
          <Link
            key={c.day}
            href={href}
            style={{
              position: "relative",
              height: 92,
              borderRadius: 14,
              overflow: "hidden",
              textDecoration: "none",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#fff",
              boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "saturate(1.02) contrast(1.02)",
                transform: "scale(1.02)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,0.0) 30%, rgba(255,255,255,0.72) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 10,
                bottom: 10,
                color: "#111",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {c.day}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/** ------------------ Mode B: Film (your “improved film” direction) ------------------
 * White wall + film strips (no dark grid)
 */
function FilmMode({ ym, cells }: { ym: string; cells: DayCell[] }) {
  // split into rows of 7 like calendar
  const rows = useMemo(() => {
    const out: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((row, idx) => (
        <div
          key={idx}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 12,
          }}
        >
          {row.map((c) => {
            const src = c.image ?? getDefaultImageForDay(ym, c.day);
            const href = `/month/${ym}/day/${c.day}?mode=film`;

            return (
              <Link
                key={c.day}
                href={href}
                style={{
                  textDecoration: "none",
                  color: "#111",
                }}
              >
                <div
                  style={{
                    borderRadius: 14,
                    padding: 10,
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
                  }}
                >
                  {/* film frame */}
                  <div
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.12)",
                      background: "#f2f2f2",
                    }}
                  >
                    <div
                      style={{
                        height: 76,
                        backgroundImage: `url(${src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </div>

                  {/* tiny film text line */}
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      letterSpacing: 0.3,
                      color: "rgba(0,0,0,0.62)",
                    }}
                  >
                    <span>{ym}</span>
                    <span>DAY {pad2(c.day)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** ------------------ Mode C: Instant (polaroid wall) ------------------ */
function InstantMode({ ym, cells }: { ym: string; cells: DayCell[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 12,
      }}
    >
      {cells.map((c) => {
        const src = c.image ?? getDefaultImageForDay(ym, c.day);
        const href = `/month/${ym}/day/${c.day}?mode=instant`;

        return (
          <Link
            key={c.day}
            href={href}
            style={{
              textDecoration: "none",
              color: "#111",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 10,
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
                transform: `rotate(${(c.day % 3) - 1}deg)`,
                transformOrigin: "center",
              }}
            >
              <div
                style={{
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#f2f2f2",
                  border: "1px solid rgba(0,0,0,0.10)",
                }}
              >
                <div
                  style={{
                    height: 74,
                    backgroundImage: `url(${src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
              <div
                style={{
                  paddingTop: 10,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "rgba(0,0,0,0.68)",
                }}
              >
                <span>{c.day}</span>
                <span style={{ fontSize: 11 }}>{ym}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function MonthClient() {
  // ✅ 先用当前月份；如果你有 month 切换器，替换这里就行
  const now = new Date();
  const ym = useMemo(() => `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`, [now]);

  const [mode, setMode] = useState<Mode>("poster");
  const { cells } = useMonthState(ym);

  // ✅ Export：先留空（你项目里如果已有 handler，把它接回去）
  const onExport = () => {
    // TODO: hook up your existing export code
    // 先别让它报错影响 UI
    alert("Export PDF: connect your export handler here.");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 40,
        background: "#f7f7f7", // ✅ 默认白/浅灰展墙
      }}
    >
      <TopBar ym={ym} mode={mode} setMode={setMode} onExport={onExport} />

      {mode === "poster" && <PosterMode ym={ym} cells={cells} />}
      {mode === "film" && <FilmMode ym={ym} cells={cells} />}
      {mode === "instant" && <InstantMode ym={ym} cells={cells} />}
    </main>
  );
}
