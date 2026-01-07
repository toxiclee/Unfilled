"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildMonthGrid } from "@/lib/calendar";
import { mockPhotos } from "@/lib/mockPhotos";

/* ------------------ Types & Utils ------------------ */

type CalendarModeId = "poster" | "grid" | "film";

function clampMode(mode?: string): CalendarModeId {
  if (mode === "grid" || mode === "film") return mode;
  return "poster";
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function parseYM(ym?: string) {
  // ym: "YYYY-MM"
  if (!ym) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]); // 1-12
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, monthIndex0: month - 1 };
}

function formatYM(year: number, monthIndex0: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

function addMonths(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}

function coverStorageKey(ym: string) {
  return `unfilled:cover:${ym}`;
}

/* ------------------ Cover Hook ------------------ */

function useMonthCover(ym: string) {
  const key = useMemo(() => coverStorageKey(ym), [ym]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [coverSrc, setCoverSrc] = useState<string>("/covers/default.jpg");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) setCoverSrc(saved);
  }, [key]);

  function pickCover() {
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // instant preview
    const blobUrl = URL.createObjectURL(file);
    setCoverSrc(blobUrl);

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        alert("Upload failed. Check /api/upload route.");
        return;
      }

      const data = (await res.json()) as { url: string };
      setCoverSrc(data.url);
      localStorage.setItem(key, data.url);

      window.dispatchEvent(new Event("unfilled-cover-updated"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return {
    coverSrc,
    uploading,
    fileInputRef,
    pickCover,
    onFileChange,
  };
}

/* ------------------ Shared Header ------------------ */

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
  const monthName = useMemo(
    () =>
      new Date(year, monthIndex0, 1).toLocaleString("en-US", {
        month: "long",
      }),
    [year, monthIndex0]
  );

  const prev = useMemo(() => addMonths(year, monthIndex0, -1), [year, monthIndex0]);
  const next = useMemo(() => addMonths(year, monthIndex0, 1), [year, monthIndex0]);

  const prevHref = `/month?mode=${mode}&ym=${formatYM(prev.year, prev.monthIndex0)}`;
  const nextHref = `/month?mode=${mode}&ym=${formatYM(next.year, next.monthIndex0)}`;

  // Export uses cover if exists
  const [coverForExport, setCoverForExport] = useState<string>("");

  useEffect(() => {
    const key = coverStorageKey(ym);
    const saved = localStorage.getItem(key) ?? "";
    setCoverForExport(saved);

    const onUpdate = () => {
      const latest = localStorage.getItem(key) ?? "";
      setCoverForExport(latest);
    };
    window.addEventListener("unfilled-cover-updated", onUpdate);
    return () => window.removeEventListener("unfilled-cover-updated", onUpdate);
  }, [ym]);

  const exportHref =
    `/api/export/month?mode=${mode}&year=${year}&monthIndex0=${monthIndex0}` +
    (coverForExport ? `&cover=${encodeURIComponent(coverForExport)}` : "");

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 16,
      }}
    >
      <div>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <h1 style={{ margin: 0, fontSize: 34, letterSpacing: -0.6 }}>
            {monthName}
          </h1>
          <span style={{ fontSize: 16, opacity: 0.6 }}>{year}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 13, opacity: 0.55 }}>
          Month mode: {mode} · Click a day to customize.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link
            href={prevHref}
            style={{
              fontSize: 12,
              textDecoration: "none",
              color: "inherit",
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              whiteSpace: "nowrap",
            }}
          >
            ← Prev
          </Link>

          <Link
            href={nextHref}
            style={{
              fontSize: 12,
              textDecoration: "none",
              color: "inherit",
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.10)",
              background: "white",
              whiteSpace: "nowrap",
            }}
          >
            Next →
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {(["poster", "grid", "film"] as CalendarModeId[]).map((m) => (
            <Link
              key={`mode-${m}`}
              href={`/month?mode=${m}&ym=${ym}`}
              style={{
                fontSize: 12,
                textDecoration: "none",
                color: "inherit",
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,0.10)",
                background: mode === m ? "rgba(0,0,0,0.06)" : "white",
                whiteSpace: "nowrap",
              }}
            >
              {m[0].toUpperCase() + m.slice(1)}
            </Link>
          ))}
        </div>

        <a
          href={exportHref}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 12,
            textDecoration: "none",
            color: "white",
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "black",
            whiteSpace: "nowrap",
          }}
        >
          Export PDF
        </a>
      </div>
    </header>
  );
}

/* ------------------ Poster Mode ------------------ */

function PosterMode({
  year,
  monthIndex0,
  monthName,
  ym,
  mode,
  cells,
}: {
  year: number;
  monthIndex0: number;
  monthName: string;
  ym: string;
  mode: CalendarModeId;
  cells: ReturnType<typeof buildMonthGrid>["cells"];
}) {
  const { coverSrc, uploading, fileInputRef, pickCover, onFileChange } =
    useMonthCover(ym);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "white",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ width: "min(980px, 100%)" }}>
        <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

        <section
          style={{
            borderRadius: 26,
            border: "1px solid rgba(0,0,0,0.10)",
            overflow: "hidden",
            background: "rgba(0,0,0,0.02)",
          }}
        >
          {/* Cover */}
          <div style={{ position: "relative", height: 380 }}>
            <Image
              src={coverSrc}
              alt="Month cover"
              fill
              priority
              style={{ objectFit: "cover" }}
              sizes="(max-width: 1000px) 100vw, 980px"
            />

            <div style={{ position: "absolute", right: 14, top: 14 }}>
              <button
                type="button"
                onClick={pickCover}
                disabled={uploading}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.6)",
                  background: "rgba(0,0,0,0.35)",
                  color: "white",
                  fontSize: 12,
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? "Uploading..." : "Change cover"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
            </div>
          </div>

          {/* Calendar + Notes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
              padding: 18,
              background: "white",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1.2,
                  opacity: 0.7,
                  marginBottom: 10,
                }}
              >
                {String(monthIndex0 + 1).padStart(2, "0")} ·{" "}
                {monthName.toUpperCase()}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 8,
                  padding: 12,
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(0,0,0,0.02)",
                }}
              >
                {WEEKDAYS.map((d) => (
                  <div
                    key={`weekday-${d}`}
                    style={{
                      fontSize: 11,
                      opacity: 0.55,
                      textAlign: "center",
                    }}
                  >
                    {d}
                  </div>
                ))}

                {cells.map((cell, idx) => {
                  if (cell.type === "empty") return <div key={`empty-${idx}`} />;

                  const hasCustom = Boolean(mockPhotos?.[cell.day]);

                  return (
                    <Link
                      key={`poster-day-${cell.day}-${idx}`}
                      href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                      style={{
                        height: 34,
                        display: "grid",
                        placeItems: "center",
                        textDecoration: "none",
                        color: "inherit",
                        borderRadius: 10,
                        border: hasCustom
                          ? "1px solid rgba(0,0,0,0.28)"
                          : "1px solid rgba(0,0,0,0.08)",
                        background: hasCustom ? "rgba(0,0,0,0.04)" : "white",
                        fontSize: 12,
                        fontWeight: hasCustom ? 700 : 500,
                      }}
                    >
                      {cell.day}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1.2,
                  opacity: 0.7,
                  marginBottom: 10,
                }}
              >
                NOTE
              </div>

              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(0,0,0,0.08)",
                  padding: 12,
                  minHeight: 220,
                  background: "white",
                }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={`note-${i}`}
                    style={{
                      height: 22,
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            opacity: 0.5,
            textAlign: "center",
          }}
        >
          unfilled · poster mode
        </div>
      </div>
    </main>
  );
}

/* ------------------ Grid Mode ------------------ */

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
  cells: ReturnType<typeof buildMonthGrid>["cells"];
}) {
  return (
    <main style={{ minHeight: "100vh", padding: 24 }}>
      <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 10,
        }}
      >
        {WEEKDAYS.map((d) => (
          <div key={`grid-weekday-${d}`} style={{ fontSize: 12, opacity: 0.6 }}>
            {d}
          </div>
        ))}
      </section>

      <section
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 10,
        }}
      >
        {cells.map((cell, idx) => {
          if (cell.type === "empty") {
            return (
              <div
                key={`grid-empty-${idx}`}
                style={{
                  height: 108,
                  borderRadius: 18,
                  background: "rgba(0,0,0,0.02)",
                }}
              />
            );
          }

          const photo = mockPhotos?.[cell.day];

          return (
            <Link
              key={`grid-day-${cell.day}-${idx}`}
              href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
              style={{
                height: 108,
                borderRadius: 18,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "white",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {photo ? (
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 14vw, 120px"
                  style={{ objectFit: "cover", opacity: 0.92 }}
                />
              ) : null}

              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  textShadow: photo ? "0 1px 10px rgba(0,0,0,0.22)" : undefined,
                }}
              >
                {cell.day}
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

/* ------------------ Film Mode ------------------ */

function FilmMode({
  year,
  monthIndex0,
  monthName,
  ym,
  mode,
  cells,
}: {
  year: number;
  monthIndex0: number;
  monthName: string;
  ym: string;
  mode: CalendarModeId;
  cells: ReturnType<typeof buildMonthGrid>["cells"];
}) {
  const { coverSrc, uploading, fileInputRef, pickCover, onFileChange } =
    useMonthCover(ym);

  const weekdayLine = useMemo(() => WEEKDAYS.map((d) => d.toLowerCase()).join(" • "), []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#0b0b0b",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ width: "min(980px, 100%)" }}>
        <div
          style={{
            background: "white",
            borderRadius: 18,
            padding: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 16,
          }}
        >
          <Header year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} />
        </div>

        <section
          style={{
            width: "min(760px, 100%)",
            margin: "0 auto",
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "black",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              position: "relative",
              aspectRatio: "3 / 4",
              background: "black",
            }}
          >
            <Image
              src={coverSrc}
              alt="Film cover"
              fill
              priority
              style={{ objectFit: "cover" }}
              sizes="(max-width: 900px) 90vw, 760px"
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(120% 90% at 50% 30%, rgba(0,0,0,0.10), rgba(0,0,0,0.55))",
              }}
            />

            <div style={{ position: "absolute", right: 14, top: 14 }}>
              <button
                type="button"
                onClick={pickCover}
                disabled={uploading}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.45)",
                  background: "rgba(0,0,0,0.35)",
                  color: "white",
                  fontSize: 12,
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? "Uploading..." : "Change cover"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
            </div>

            <div
              style={{
                position: "absolute",
                left: 26,
                bottom: 24,
                color: "rgba(255,255,255,0.92)",
                maxWidth: "70%",
                textShadow: "0 8px 24px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  fontSize: 44,
                  letterSpacing: -0.8,
                  lineHeight: 1,
                  textTransform: "lowercase",
                  marginBottom: 8,
                }}
              >
                {monthName.toLowerCase()}
              </div>

              <div
                style={{
                  fontSize: 12,
                  opacity: 0.9,
                  letterSpacing: 0.6,
                  marginBottom: 14,
                }}
              >
                {weekdayLine}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 22px)",
                  gap: "6px 10px",
                  fontSize: 12,
                  lineHeight: 1,
                }}
              >
                {cells.map((cell, idx) => {
                  if (cell.type === "empty") return <div key={`film-empty-${idx}`} />;
                  
                  // Let's Talk: 关键修改点
                  // 将 div 替换为 Link，并设置正确的 href 路径
                  return (
                    <Link
                      key={`film-day-${cell.day}-${idx}`}
                      href={`/month/${ym}/day/${cell.day}?mode=${mode}`}
                      style={{
                        opacity: 0.95,
                        textAlign: "left",
                        fontVariantNumeric: "tabular-nums",
                        // 核心：重置链接样式，使其看起来不像链接
                        textDecoration: "none",
                        color: "inherit",
                        display: "block",
                        cursor: "pointer"
                      }}
                    >
                      {cell.day}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            opacity: 0.6,
            textAlign: "center",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          unfilled · film mode
        </div>
      </div>
    </main>
  );
}
/* ------------------ Page ------------------ */

export default function MonthPage() {
  const searchParams = useSearchParams();
  const mode = clampMode(searchParams.get("mode") ?? undefined);

  const base = new Date();
  const ymFromUrl = parseYM(searchParams.get("ym") ?? undefined);

  const year = ymFromUrl?.year ?? base.getFullYear();
  const monthIndex0 = ymFromUrl?.monthIndex0 ?? base.getMonth();

  const ym = formatYM(year, monthIndex0);
  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", {
    month: "long",
  });

  const { cells } = buildMonthGrid(year, monthIndex0);

  // key forces a small re-mount between months
  const ymKey = ym;

  if (mode === "grid") {
    return (
      <div key={ymKey}>
        <GridMode year={year} monthIndex0={monthIndex0} ym={ym} mode={mode} cells={cells} />
      </div>
    );
  }

  if (mode === "film") {
    return (
      <div key={ymKey}>
        <FilmMode
          year={year}
          monthIndex0={monthIndex0}
          monthName={monthName}
          ym={ym}
          mode={mode}
          cells={cells}
        />
      </div>
    );
  }

  return (
    <div key={ymKey}>
      <PosterMode
        year={year}
        monthIndex0={monthIndex0}
        monthName={monthName}
        ym={ym}
        mode={mode}
        cells={cells}
      />
    </div>
  );
}
