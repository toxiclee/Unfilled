"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildMonthGrid } from "@/lib/calendar";

/* ------------------ Types ------------------ */
type CalendarModeId = "poster" | "film" | "instant";

/* ------------------ Constants ------------------ */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/* ------------------ Utils ------------------ */
function clampMode(mode?: string | null): CalendarModeId {
  if (mode === "film" || mode === "instant") return mode;
  return "poster"; // ✅ 白色默认
}

function getDefaultCover(mode: CalendarModeId) {
  if (mode === "film") return "/defaults/film.jpg";
  if (mode === "instant") return "/defaults/instant.jpg";
  return "/defaults/poster.jpg";
}

/* ------------------ Cover Hook ------------------ */
function useMonthCover(ym: string, mode: CalendarModeId) {
  const key = `unfilled:cover:${ym}:${mode}`;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [coverSrc, setCoverSrc] = useState<string>(getDefaultCover(mode));

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) setCoverSrc(saved);
  }, [key]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    setCoverSrc(blobUrl);
    localStorage.setItem(key, blobUrl);
  };

  return {
    coverSrc,
    fileInputRef,
    pickCover: () => fileInputRef.current?.click(),
    onFileChange,
  };
}

/* ------------------ Header ------------------ */
function Header({ ym, mode }: { ym: string; mode: CalendarModeId }) {
  const [year, month] = ym.split("-");
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
      <h1 style={{ margin: 0 }}>{`${year}-${month}`}</h1>
      <div style={{ display: "flex", gap: 8 }}>
        {(["poster", "film", "instant"] as const).map(m => (
          <Link
            key={m}
            href={`/month/${ym}?mode=${m}`}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              textDecoration: "none",
              border: "1px solid #ccc",
              background: mode === m ? "#000" : "#fff",
              color: mode === m ? "#fff" : "#000",
              fontSize: 12
            }}
          >
            {m}
          </Link>
        ))}
        <button style={{ marginLeft: 8 }}>Export PDF</button>
      </div>
    </div>
  );
}

/* ------------------ Poster (White Default) ------------------ */
function PosterMode({ ym, cells }: any) {
  return (
    <div style={{ background: "#f7f7f7", minHeight: "100vh", padding: 40 }}>
      <Header ym={ym} mode="poster" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 12 }}>
        {cells.map((c: any, i: number) =>
          c.type === "empty" ? <div key={i} /> : (
            <Link
              key={i}
              href={`/month/${ym}/day/${c.day}?mode=poster`}
              style={{
                background: "#fff",
                padding: 20,
                textAlign: "center",
                borderRadius: 8,
                textDecoration: "none",
                color: "#000"
              }}
            >
              {c.day}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

/* ------------------ Film (Your Beautified Version) ------------------ */
function FilmMode({ ym, year, monthIndex0, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } =
    useMonthCover(ym, "film");

  const monthName = new Date(year, monthIndex0, 1)
    .toLocaleString("en-US", { month: "long" })
    .toLowerCase();

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", padding: 40 }}>
      <Header ym={ym} mode="film" />
      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
        <div style={{ aspectRatio: "4/5", position: "relative" }}>
          <Image src={coverSrc} alt="film" fill style={{ objectFit: "cover" }} />
          <button
            onClick={pickCover}
            style={{ position: "absolute", top: 20, right: 20 }}
          >
            Replace Film
          </button>
          <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />
        </div>

        <h2 style={{ color: "#fff", marginTop: 20 }}>{monthName} {year}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", color: "#fff" }}>
          {cells.map((c: any, i: number) =>
            c.type === "empty" ? <div key={i} /> : <div key={i}>{c.day}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------ Instant (Polaroid) ------------------ */
function InstantMode({ ym, year, monthIndex0, cells }: any) {
  const { coverSrc, fileInputRef, pickCover, onFileChange } =
    useMonthCover(ym, "instant");

  const monthName = new Date(year, monthIndex0, 1).toLocaleString("en-US", {
    month: "long",
  });

  return (
    <div style={{ background: "#e8e8e8", minHeight: "100vh", padding: 40 }}>
      <Header ym={ym} mode="instant" />
      <div style={{ background: "#fff", padding: 20, maxWidth: 500, margin: "0 auto" }}>
        <div style={{ aspectRatio: "1/1", position: "relative" }} onClick={pickCover}>
          <Image src={coverSrc} alt="instant" fill style={{ objectFit: "cover" }} />
        </div>
        <input ref={fileInputRef} type="file" hidden onChange={onFileChange} />
        <h2 style={{ textAlign: "center" }}>{monthName} {year}</h2>
      </div>
    </div>
  );
}

/* ------------------ Main ------------------ */
export default function MonthClient() {
  const params = useParams();
  const searchParams = useSearchParams();

  const ym = (params.id as string) ?? "2026-01";
  const mode = clampMode(searchParams.get("mode"));

  const [year, monthIndex0] = ym.split("-").map(Number);
  const { cells } = buildMonthGrid(year, monthIndex0 - 1);

  if (mode === "film") return <FilmMode ym={ym} year={year} monthIndex0={monthIndex0 - 1} cells={cells} />;
  if (mode === "instant") return <InstantMode ym={ym} year={year} monthIndex0={monthIndex0 - 1} cells={cells} />;
  return <PosterMode ym={ym} cells={cells} />;
}
